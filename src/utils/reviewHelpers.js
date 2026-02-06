/**
 * Review helper utilities
 * Date formatting, rating labels, and other review-related helpers
 */

import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Format a date as relative time (e.g., "2 days ago", "January 2025")
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatReviewDate = (date) => {
  if (!date) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  } else if (diffMonths < 12) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } else {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
};

/**
 * 4-Category Rating Labels
 */

// Cleanliness labels
export const CLEANLINESS_LABELS = {
  1: 'Disaster Zone 🤢',
  2: 'Questionable 😬',
  3: 'Clean Enough 🧼',
  4: 'Sparkling ✨',
  5: 'Spotless 🏆',
};

// Supplies/Amenities labels
export const SUPPLIES_LABELS = {
  1: 'Barren 😭',
  2: 'Running Low 📉',
  3: 'Adequate 👌',
  4: 'Well Stocked 📦',
  5: 'Fully Loaded 🎯',
};

// Accessibility labels
export const ACCESSIBILITY_LABELS = {
  1: 'Lost Forever 😤',
  2: 'Confusing 🤔',
  3: 'Found It 👍',
  4: 'Well Marked 🪧',
  5: "Can't Miss It 🎯",
};

// Wait Time labels
export const WAIT_TIME_LABELS = {
  1: 'Forever 😫',
  2: 'Too Long ⏰',
  3: 'A Bit 🕐',
  4: 'Quick 🏃',
  5: 'No Wait! 🚀',
};

// Rating category configs for easy iteration
export const RATING_CATEGORIES = [
  {
    key: 'cleanliness',
    icon: '🧼',
    title: 'How clean was it?',
    labels: CLEANLINESS_LABELS,
  },
  {
    key: 'supplies',
    icon: '🧻',
    title: 'Were supplies stocked?',
    helperText: 'Toilet paper, soap, towels',
    labels: SUPPLIES_LABELS,
  },
  {
    key: 'accessibility',
    icon: '🚪',
    title: 'How easy to find?',
    helperText: 'Signage, entrance, location',
    labels: ACCESSIBILITY_LABELS,
  },
  {
    key: 'waitTime',
    icon: '⏱️',
    title: 'How long did you wait?',
    helperText: 'Line length, availability',
    labels: WAIT_TIME_LABELS,
  },
];

/**
 * Get label for a specific category and value
 * @param {string} category - Category key (cleanliness, supplies, accessibility, waitTime)
 * @param {number} value - Rating value (1-5)
 * @returns {string} Rating label
 */
export const getCategoryLabel = (category, value) => {
  const labelMaps = {
    cleanliness: CLEANLINESS_LABELS,
    supplies: SUPPLIES_LABELS,
    accessibility: ACCESSIBILITY_LABELS,
    waitTime: WAIT_TIME_LABELS,
  };
  return labelMaps[category]?.[value] || '';
};

/**
 * Get cleanliness label by value (legacy support)
 * @param {number} cleanliness - Cleanliness value (1-5)
 * @returns {string} Cleanliness label
 */
export const getCleanlinessLabel = (cleanliness) => {
  return CLEANLINESS_LABELS[cleanliness] || '';
};

/**
 * Calculate average from 4 ratings
 * @param {Object} ratings - Object with cleanliness, supplies, accessibility, waitTime
 * @returns {number} Average rating rounded to 1 decimal
 */
export const calculateAverageFromRatings = (ratings) => {
  if (!ratings) return 0;
  const { cleanliness = 0, supplies = 0, accessibility = 0, waitTime = 0 } = ratings;
  const sum = cleanliness + supplies + accessibility + waitTime;
  const count = [cleanliness, supplies, accessibility, waitTime].filter(r => r > 0).length;
  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
};

/**
 * Calculate average rating from reviews (using averageRating field)
 * @param {Array} reviews - Array of review objects
 * @returns {number} Average rating (0 if no reviews)
 */
export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.averageRating || review.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

/**
 * Get initials from a name
 * @param {string} name - User name
 * @returns {string} First letter uppercase
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

/**
 * Truncate review text with ellipsis
 * @param {string} text - Review text
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 150) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Check if all 4 ratings are provided
 * @param {Object} ratings - Ratings object
 * @returns {boolean} True if all 4 ratings are present
 */
export const hasAllRatings = (ratings) => {
  if (!ratings) return false;
  return (
    ratings.cleanliness > 0 &&
    ratings.supplies > 0 &&
    ratings.accessibility > 0 &&
    ratings.waitTime > 0
  );
};

/**
 * Count how many ratings are filled
 * @param {Object} ratings - Ratings object
 * @returns {number} Count of filled ratings (0-4)
 */
export const countFilledRatings = (ratings) => {
  if (!ratings) return 0;
  return [
    ratings.cleanliness,
    ratings.supplies,
    ratings.accessibility,
    ratings.waitTime,
  ].filter(r => r > 0).length;
};

/**
 * Recalculate restroom ratings from all reviews
 * Call this after a review is submitted or deleted
 * @param {string} restroomId - The restroom ID
 * @returns {Object} Updated ratings data
 */
export const recalculateRestroomRatings = async (restroomId) => {
  try {
    console.log('[recalculateRatings] Starting for restroom:', restroomId);

    // Get all reviews for this restroom
    const q = query(
      collection(db, 'reviews'),
      where('restroomId', '==', restroomId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[recalculateRatings] No reviews found, resetting ratings');
      // No reviews, reset to 0
      await updateDoc(doc(db, 'restrooms', restroomId), {
        ratings: {
          cleanliness: 0,
          supplies: 0,
          accessibility: 0,
          waitTime: 0,
        },
        rating: 0,
        reviewCount: 0,
        updatedAt: new Date(),
      });
      return {
        ratings: { cleanliness: 0, supplies: 0, accessibility: 0, waitTime: 0 },
        rating: 0,
        reviewCount: 0,
      };
    }

    // Calculate averages from all reviews
    let totalCleanliness = 0;
    let totalSupplies = 0;
    let totalAccessibility = 0;
    let totalWaitTime = 0;
    let cleanlinessCount = 0;
    let suppliesCount = 0;
    let accessibilityCount = 0;
    let waitTimeCount = 0;

    snapshot.forEach(docSnap => {
      const review = docSnap.data();

      // Handle both new format (ratings object) and old format (separate fields)
      if (review.ratings) {
        if (review.ratings.cleanliness > 0) {
          totalCleanliness += review.ratings.cleanliness;
          cleanlinessCount++;
        }
        if (review.ratings.supplies > 0) {
          totalSupplies += review.ratings.supplies;
          suppliesCount++;
        }
        if (review.ratings.accessibility > 0) {
          totalAccessibility += review.ratings.accessibility;
          accessibilityCount++;
        }
        if (review.ratings.waitTime > 0) {
          totalWaitTime += review.ratings.waitTime;
          waitTimeCount++;
        }
      } else if (review.cleanliness) {
        // Old format - only had cleanliness
        totalCleanliness += review.cleanliness;
        cleanlinessCount++;
      }
    });

    // Calculate averages (only for categories with data)
    const avgCleanliness = cleanlinessCount > 0 ? totalCleanliness / cleanlinessCount : 0;
    const avgSupplies = suppliesCount > 0 ? totalSupplies / suppliesCount : 0;
    const avgAccessibility = accessibilityCount > 0 ? totalAccessibility / accessibilityCount : 0;
    const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;

    // Calculate overall rating (average of non-zero categories)
    const validRatings = [avgCleanliness, avgSupplies, avgAccessibility, avgWaitTime].filter(r => r > 0);
    const overallRating = validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
      : 0;

    const updatedData = {
      ratings: {
        cleanliness: Number(avgCleanliness.toFixed(2)),
        supplies: Number(avgSupplies.toFixed(2)),
        accessibility: Number(avgAccessibility.toFixed(2)),
        waitTime: Number(avgWaitTime.toFixed(2)),
      },
      rating: Number(overallRating.toFixed(2)),
      reviewCount: snapshot.size,
      updatedAt: new Date(),
    };

    console.log('[recalculateRatings] Updating restroom with:', updatedData);

    // Update restroom document
    await updateDoc(doc(db, 'restrooms', restroomId), updatedData);

    return updatedData;

  } catch (error) {
    console.error('[recalculateRatings] Error:', error);
    throw error;
  }
};
