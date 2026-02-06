/**
 * Bathroom Types Constants
 * Defines the available bathroom types for restrooms
 */

export const BATHROOM_TYPES = [
  {
    id: 'all_gender',
    label: 'All-Gender',
    emoji: '🚻',
    description: 'Open to everyone',
    keywords: ['all', 'gender neutral', 'unisex', 'inclusive', 'everyone'],
  },
  {
    id: 'mens',
    label: "Men's",
    emoji: '🚹',
    description: "Men's restroom",
    keywords: ['men', 'male', 'guys', 'gentlemen'],
  },
  {
    id: 'womens',
    label: "Women's",
    emoji: '🚺',
    description: "Women's restroom",
    keywords: ['women', 'female', 'ladies'],
  },
  {
    id: 'family',
    label: 'Family',
    emoji: '👨‍👩‍👧',
    description: 'Family restroom with changing table',
    keywords: ['family', 'parents', 'kids', 'children', 'baby', 'companion'],
  },
];

/**
 * Get bathroom type by ID
 * @param {string} id - Bathroom type ID
 * @returns {Object|undefined} Bathroom type object
 */
export const getBathroomTypeById = (id) => {
  return BATHROOM_TYPES.find(type => type.id === id);
};

/**
 * Get bathroom type label with emoji
 * @param {string} id - Bathroom type ID
 * @returns {string} Label with emoji
 */
export const getBathroomTypeLabel = (id) => {
  const type = getBathroomTypeById(id);
  return type ? `${type.emoji} ${type.label}` : 'Unknown';
};

/**
 * Get bathroom type emoji
 * @param {string} id - Bathroom type ID
 * @returns {string} Emoji
 */
export const getBathroomTypeEmoji = (id) => {
  const type = getBathroomTypeById(id);
  return type ? type.emoji : '🚽';
};

/**
 * Get all bathroom type IDs
 * @returns {string[]} Array of bathroom type IDs
 */
export const getAllBathroomTypeIds = () => {
  return BATHROOM_TYPES.map(type => type.id);
};
