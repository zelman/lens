// Shared dimension constants for R→C and C→R lens scoring
// Single source of truth for dimension keys and labels

export const DIMENSION_KEYS = [
  'essence_clarity',
  'skill_depth',
  'values_articulation',
  'mission_alignment',
  'work_style_clarity',
  'boundaries_defined',
];

export const DIMENSION_LABELS = {
  essence_clarity: 'Essence',
  skill_depth: 'Skills & Experience',
  values_articulation: 'Values',
  mission_alignment: 'Mission & Direction',
  work_style_clarity: 'Work Style',
  boundaries_defined: 'Non-Negotiables',
};

// Validate that an object has valid dimension scores
export function validateDimensionScores(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  // At least one dimension should be present
  return DIMENSION_KEYS.some(key => typeof obj[key] === 'number');
}

// Get dimension score with fallback
export function getDimensionScore(dimensions, key, fallback = 50) {
  if (!dimensions || typeof dimensions[key] !== 'number') {
    return fallback;
  }
  return Math.max(0, Math.min(100, dimensions[key]));
}
