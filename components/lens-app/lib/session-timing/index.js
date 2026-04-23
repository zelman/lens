/**
 * Session Timing Module
 *
 * Shared logic for enforcing section duration budgets in R→C discovery sessions.
 * Framework-agnostic (no Next.js imports) for use in both server routes and workers.
 *
 * Budget enforcement uses question count (not wall-clock time) because:
 * - Serverless routes are stateless across turns
 * - Wall-clock reconstruction adds complexity and surface area
 * - Question count aligns with how synthesis chunks the conversation
 * - More predictable UX (N questions vs "about X minutes")
 */

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Questions per minute conversion constant.
 * Used to translate durationMin → maxQuestions.
 *
 * Rationale for 1.5:
 * - Average coaching question + response takes 40-50 seconds
 * - Allows for natural pauses and reflection
 * - 4 min section → 6 questions (rounded up from 6.0)
 * - 7 min section → 11 questions (rounded up from 10.5)
 *
 * Adjustable based on tester feedback.
 */
export const QUESTIONS_PER_MINUTE = 1.5;

/**
 * Minimum questions per section regardless of duration.
 * Ensures even durationMin: 1 gets meaningful exploration.
 */
export const MIN_QUESTIONS_PER_SECTION = 2;

// ═══════════════════════════════════════════════════════════════════════════
// Budget Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate section budget from session config section.
 *
 * SECURITY: Always recalculates maxQuestions from durationMin server-side.
 * Never trusts client-provided maxQuestions to prevent budget manipulation.
 *
 * @param {Object} section - Section from session config (foundation or tailored)
 * @param {number} section.durationMin - Duration in minutes (optional, defaults handled)
 * @param {string} section.type - "foundation" or "tailored" (affects defaults)
 * @returns {{ maxQuestions: number, durationMinHint: number }}
 */
export function sectionBudgetFromConfig(section) {
  // SECURITY: Always calculate from durationMin, never trust client maxQuestions
  // This prevents clients from sending inflated maxQuestions to bypass budget
  const durationMin = section.durationMin || (section.type === "foundation" ? 2 : 4);

  // Validate durationMin is a reasonable number
  const safeDuration = Number(durationMin);
  if (!Number.isFinite(safeDuration) || safeDuration < 0) {
    // Fall back to type-based default for invalid input
    const fallback = section.type === "foundation" ? 2 : 4;
    return {
      maxQuestions: Math.ceil(fallback * QUESTIONS_PER_MINUTE),
      durationMinHint: fallback,
    };
  }

  const calculated = Math.ceil(safeDuration * QUESTIONS_PER_MINUTE);
  const maxQuestions = Math.max(calculated, MIN_QUESTIONS_PER_SECTION);

  return {
    maxQuestions,
    durationMinHint: safeDuration,
  };
}

/**
 * Calculate maxQuestions for a given duration.
 * Utility function for generate-session to pre-populate sections.
 *
 * @param {number} durationMin - Duration in minutes
 * @returns {number} - Number of questions (minimum MIN_QUESTIONS_PER_SECTION)
 */
export function questionsFromDuration(durationMin) {
  const calculated = Math.ceil(durationMin * QUESTIONS_PER_MINUTE);
  return Math.max(calculated, MIN_QUESTIONS_PER_SECTION);
}

// ═══════════════════════════════════════════════════════════════════════════
// Budget Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if section budget is exhausted.
 *
 * @param {Object} sectionState - Current section state
 * @param {number} sectionState.questionsAsked - Number of assistant messages in this section
 * @param {number} sectionState.maxQuestions - Budget limit for this section
 * @returns {boolean} - True if budget exhausted
 */
export function isSectionBudgetExhausted(sectionState) {
  const { questionsAsked, maxQuestions } = sectionState;
  return questionsAsked >= maxQuestions;
}

/**
 * Get budget status for UI hints and API responses.
 *
 * @param {Object} sectionState - Current section state
 * @param {number} sectionState.questionsAsked - Number of assistant messages
 * @param {number} sectionState.maxQuestions - Budget limit
 * @returns {{ exhausted: boolean, remaining: number, atLimit: boolean, nearLimit: boolean }}
 */
export function getBudgetStatus(sectionState) {
  const { questionsAsked, maxQuestions } = sectionState;
  const remaining = Math.max(0, maxQuestions - questionsAsked);

  return {
    exhausted: remaining === 0,
    remaining,
    atLimit: remaining === 0,
    nearLimit: remaining === 1,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Session State Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Advance to the next section in the session.
 * Returns updated session state with new currentSectionIndex.
 *
 * @param {Object} sessionState - Current session state
 * @param {number} sessionState.currentSectionIndex - Current section index
 * @param {Array} sessionState.sections - All sections in the session
 * @param {Object} sessionState.sectionData - Accumulated section summaries
 * @param {string} currentSectionSummary - Summary from the section being completed
 * @returns {Object} - Updated session state
 */
export function advanceSection(sessionState, currentSectionSummary = null) {
  const { currentSectionIndex, sections, sectionData = {} } = sessionState;
  const currentSection = sections[currentSectionIndex];

  // Store summary if provided
  const updatedSectionData = { ...sectionData };
  if (currentSectionSummary && currentSection) {
    updatedSectionData[currentSection.id] = currentSectionSummary;
  }

  const nextIndex = currentSectionIndex + 1;
  const isComplete = nextIndex >= sections.length;

  return {
    ...sessionState,
    currentSectionIndex: isComplete ? currentSectionIndex : nextIndex,
    sectionData: updatedSectionData,
    isSessionComplete: isComplete,
  };
}

/**
 * Build transition signal for API response.
 *
 * @param {Object} options - Transition options
 * @param {Object} options.fromSection - Section being left
 * @param {Object|null} options.toSection - Section being entered (null if session complete)
 * @param {string} options.reason - Transition reason ("budget_exhausted" | "section_complete" | "user_initiated")
 * @returns {Object} - Transition signal for response payload
 */
export function buildTransitionSignal({ fromSection, toSection, reason }) {
  return {
    transition: {
      from: fromSection?.id || null,
      to: toSection?.id || null,
      reason,
      timestamp: new Date().toISOString(),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate section has required timing fields.
 *
 * @param {Object} section - Section to validate
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateSectionTiming(section) {
  const missing = [];

  if (!section.id) missing.push("id");
  if (section.maxQuestions === undefined && section.durationMin === undefined) {
    missing.push("maxQuestions or durationMin");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
