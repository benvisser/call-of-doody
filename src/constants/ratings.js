/**
 * Rating Categories Configuration
 * Unified 4-category rating system used throughout the app
 */

export const RATING_CATEGORIES = [
  {
    key: 'cleanliness',
    label: 'Cleanliness',
    emoji: '🧼',
    description: 'How clean was it?',
    levels: [
      { value: 1, label: 'Disaster Zone 🤢' },
      { value: 2, label: 'Pretty Gross 😬' },
      { value: 3, label: 'Could Be Better 😐' },
      { value: 4, label: 'Pretty Clean 😊' },
      { value: 5, label: 'Spotless 🏆' },
    ],
  },
  {
    key: 'supplies',
    label: 'Supplies',
    emoji: '🧻',
    description: 'Were supplies stocked?',
    hint: 'Toilet paper, soap, towels',
    levels: [
      { value: 1, label: 'Barren 😭' },
      { value: 2, label: 'Low Stock 😟' },
      { value: 3, label: 'Adequate 👍' },
      { value: 4, label: 'Well Stocked 😄' },
      { value: 5, label: 'Fully Loaded 🎯' },
    ],
  },
  {
    key: 'accessibility',
    label: 'Accessibility',
    emoji: '🚪',
    description: 'How easy to find?',
    hint: 'Signage, entrance, location',
    levels: [
      { value: 1, label: 'Lost Forever 😤' },
      { value: 2, label: 'Confusing 😕' },
      { value: 3, label: 'Average 🤷' },
      { value: 4, label: 'Easy to Find 😊' },
      { value: 5, label: "Can't Miss It 🎯" },
    ],
  },
  {
    key: 'waitTime',
    label: 'Wait Time',
    emoji: '⏱️',
    description: 'How long did you wait?',
    hint: 'Line length, availability',
    levels: [
      { value: 1, label: 'Forever 😫' },
      { value: 2, label: 'Long Wait 😓' },
      { value: 3, label: 'Moderate ⏳' },
      { value: 4, label: 'Quick 😊' },
      { value: 5, label: 'No Wait! 🚀' },
    ],
  },
];

/**
 * Get rating category by key
 * @param {string} key - Category key (cleanliness, supplies, accessibility, waitTime)
 * @returns {Object|undefined} Category object
 */
export const getRatingCategory = (key) => {
  return RATING_CATEGORIES.find(cat => cat.key === key);
};

/**
 * Get label for a specific rating value in a category
 * @param {string} categoryKey - Category key
 * @param {number} value - Rating value (1-5)
 * @returns {string} Rating label
 */
export const getRatingLabel = (categoryKey, value) => {
  const category = getRatingCategory(categoryKey);
  if (!category) return '';
  const level = category.levels.find(l => l.value === value);
  return level?.label || '';
};

/**
 * Calculate overall rating from 4 categories
 * @param {Object} ratings - Object with cleanliness, supplies, accessibility, waitTime
 * @returns {number} Average rating (0 if no ratings)
 */
export const calculateOverallRating = (ratings) => {
  if (!ratings) return 0;
  const values = [
    ratings.cleanliness || 0,
    ratings.supplies || 0,
    ratings.accessibility || 0,
    ratings.waitTime || 0,
  ];
  const validValues = values.filter(v => v > 0);
  if (validValues.length === 0) return 0;
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return Number((sum / validValues.length).toFixed(2));
};

/**
 * Check if ratings object has any values
 * @param {Object} ratings - Ratings object
 * @returns {boolean} True if any rating is > 0
 */
export const hasAnyRatings = (ratings) => {
  if (!ratings) return false;
  return (
    (ratings.cleanliness || 0) > 0 ||
    (ratings.supplies || 0) > 0 ||
    (ratings.accessibility || 0) > 0 ||
    (ratings.waitTime || 0) > 0
  );
};

/**
 * Initialize empty ratings object
 * @returns {Object} Ratings object with all zeros
 */
export const initializeRatings = () => ({
  cleanliness: 0,
  supplies: 0,
  accessibility: 0,
  waitTime: 0,
});

/**
 * Default export for convenience
 */
export default {
  RATING_CATEGORIES,
  getRatingCategory,
  getRatingLabel,
  calculateOverallRating,
  hasAnyRatings,
  initializeRatings,
};
