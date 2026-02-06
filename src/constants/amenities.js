// src/constants/amenities.js

export const AMENITIES = {
  // TOP 5 (Always visible)
  toilet_paper: {
    id: 'toilet_paper',
    name: 'Toilet Paper',
    emoji: '🧻',
    category: 'essentials',
    priority: 1,
    description: 'Has toilet paper stocked',
  },
  soap: {
    id: 'soap',
    name: 'Soap',
    emoji: '🧼',
    category: 'essentials',
    priority: 2,
    description: 'Has hand soap available',
  },
  wheelchair_accessible: {
    id: 'wheelchair_accessible',
    name: 'Wheelchair Accessible',
    emoji: '♿',
    category: 'accessibility',
    priority: 3,
    description: 'ADA compliant, wheelchair accessible',
  },
  changing_table: {
    id: 'changing_table',
    name: 'Changing Table',
    emoji: '🚼',
    category: 'family',
    priority: 4,
    description: 'Has baby changing table',
  },
  privacy_lock: {
    id: 'privacy_lock',
    name: 'Working Lock',
    emoji: '🔒',
    category: 'essentials',
    priority: 5,
    description: 'Door has working lock',
  },

  // NEXT 5 (Show All)
  paper_towels: {
    id: 'paper_towels',
    name: 'Paper Towels',
    emoji: '🧴',
    category: 'hygiene',
    priority: 6,
    description: 'Paper towels for hand drying',
  },
  hand_dryer: {
    id: 'hand_dryer',
    name: 'Hand Dryer',
    emoji: '💨',
    category: 'hygiene',
    priority: 7,
    description: 'Electric hand dryer available',
  },
  multiple_stalls: {
    id: 'multiple_stalls',
    name: 'Multiple Stalls',
    emoji: '🚽',
    category: 'capacity',
    priority: 8,
    description: '2+ stalls available',
  },
  gender_neutral: {
    id: 'gender_neutral',
    name: 'Gender Neutral',
    emoji: '🚻',
    category: 'accessibility',
    priority: 9,
    description: 'Gender neutral/all-gender restroom',
  },
  regularly_cleaned: {
    id: 'regularly_cleaned',
    name: 'Regularly Cleaned',
    emoji: '🧽',
    category: 'cleanliness',
    priority: 10,
    description: 'Shows signs of regular cleaning',
  },

  // EXTENDED AMENITIES (11-25)
  mirror: {
    id: 'mirror',
    name: 'Mirror',
    emoji: '🪞',
    category: 'convenience',
    priority: 11,
    description: 'Has mirror for grooming',
  },
  single_occupancy: {
    id: 'single_occupancy',
    name: 'Single Occupancy',
    emoji: '🚪',
    category: 'privacy',
    priority: 12,
    description: 'Private single-person restroom',
  },
  family_restroom: {
    id: 'family_restroom',
    name: 'Family Restroom',
    emoji: '👨‍👩‍👧',
    category: 'family',
    priority: 13,
    description: 'Dedicated family restroom',
  },
  key_code_required: {
    id: 'key_code_required',
    name: 'Key/Code Required',
    emoji: '🔑',
    category: 'access',
    priority: 14,
    description: 'Requires key or access code',
  },
  hand_sanitizer: {
    id: 'hand_sanitizer',
    name: 'Hand Sanitizer',
    emoji: '🧴',
    category: 'hygiene',
    priority: 15,
    description: 'Hand sanitizer available',
  },
  trash_can: {
    id: 'trash_can',
    name: 'Trash Can',
    emoji: '🗑️',
    category: 'cleanliness',
    priority: 16,
    description: 'Has trash receptacle',
  },
  coat_hook: {
    id: 'coat_hook',
    name: 'Coat Hook',
    emoji: '🪝',
    category: 'convenience',
    priority: 17,
    description: 'Hook for coats/bags',
  },
  baby_seat: {
    id: 'baby_seat',
    name: 'Baby Seat',
    emoji: '💺',
    category: 'family',
    priority: 18,
    description: 'Baby seat/holder available',
  },
  phone_shelf: {
    id: 'phone_shelf',
    name: 'Phone Shelf',
    emoji: '📱',
    category: 'convenience',
    priority: 19,
    description: 'Shelf for phone/belongings',
  },
  climate_controlled: {
    id: 'climate_controlled',
    name: 'Climate Controlled',
    emoji: '🌡️',
    category: 'comfort',
    priority: 20,
    description: 'Heated/cooled restroom',
  },
  sound_masking: {
    id: 'sound_masking',
    name: 'Sound Masking',
    emoji: '🎵',
    category: 'privacy',
    priority: 21,
    description: 'Music or white noise',
  },
  bidet: {
    id: 'bidet',
    name: 'Bidet',
    emoji: '🚿',
    category: 'luxury',
    priority: 22,
    description: 'Bidet available',
  },
  outlets: {
    id: 'outlets',
    name: 'Power Outlets',
    emoji: '⚡',
    category: 'convenience',
    priority: 23,
    description: 'Electrical outlets available',
  },
  good_lighting: {
    id: 'good_lighting',
    name: 'Good Lighting',
    emoji: '💡',
    category: 'safety',
    priority: 24,
    description: 'Well-lit interior',
  },
  free_access: {
    id: 'free_access',
    name: 'Free (No Purchase)',
    emoji: '🆓',
    category: 'access',
    priority: 25,
    description: 'No purchase required',
  },
};

// Helper functions
export const getTopAmenities = (count = 5) => {
  return Object.values(AMENITIES)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count);
};

export const getAllAmenities = () => {
  return Object.values(AMENITIES)
    .sort((a, b) => a.priority - b.priority);
};

export const getAmenitiesByCategory = (category) => {
  return Object.values(AMENITIES)
    .filter(a => a.category === category)
    .sort((a, b) => a.priority - b.priority);
};

export const getAmenityById = (id) => {
  return AMENITIES[id];
};

// Voting thresholds
export const AMENITY_THRESHOLDS = {
  MIN_VOTES_REQUIRED: 5,      // Need 5+ votes to change status
  CONFIRM_PERCENTAGE: 60,     // 60%+ confirms → "confirmed"
  REMOVE_PERCENTAGE: 40,      // <40% confirms → "removed"
};
