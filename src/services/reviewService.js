import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, isConfigured } from '../config/firebase.js';

const REVIEWS_COLLECTION = 'reviews';
const RESTROOMS_COLLECTION = 'restrooms';

/**
 * Check if Firebase is properly configured
 */
const isFirebaseConfigured = () => {
  if (!isConfigured) {
    console.warn('[ReviewService] Firebase not configured');
  }
  return isConfigured && db !== null;
};

/**
 * Submit a new review with 4-category ratings and update restroom averages
 * @param {Object} reviewData - The review data
 * @param {string} reviewData.restroomId - The restroom ID
 * @param {Object} reviewData.ratings - The 4-category ratings
 * @param {number} reviewData.ratings.cleanliness - Cleanliness rating (1-5)
 * @param {number} reviewData.ratings.supplies - Supplies rating (1-5)
 * @param {number} reviewData.ratings.accessibility - Accessibility rating (1-5)
 * @param {number} reviewData.ratings.waitTime - Wait time rating (1-5)
 * @param {number} reviewData.averageRating - Pre-calculated average of 4 ratings
 * @param {string} reviewData.reviewText - Optional review text
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const submitReview = async (reviewData) => {
  console.log('[ReviewService] Submitting review for restroom:', reviewData.restroomId);

  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  // Validate ratings
  const { ratings, averageRating } = reviewData;
  if (!ratings || !ratings.cleanliness || !ratings.supplies ||
      !ratings.accessibility || !ratings.waitTime) {
    return { success: false, error: 'All 4 ratings are required' };
  }

  try {
    const restroomRef = doc(db, RESTROOMS_COLLECTION, reviewData.restroomId);

    // Use transaction to ensure atomic update of review and restroom ratings
    const result = await runTransaction(db, async (transaction) => {
      // Get current restroom data
      const restroomDoc = await transaction.get(restroomRef);
      if (!restroomDoc.exists()) {
        throw new Error('Restroom not found');
      }

      const restroomData = restroomDoc.data();
      const currentReviewCount = restroomData.reviews || 0;
      const currentRating = restroomData.rating || 0;
      const currentCleanliness = restroomData.cleanliness || 0;

      // Calculate new restroom averages
      const newReviewCount = currentReviewCount + 1;
      const newRating = ((currentRating * currentReviewCount) + averageRating) / newReviewCount;
      const newCleanliness = ((currentCleanliness * currentReviewCount) + ratings.cleanliness) / newReviewCount;

      // Create review document with 4-category structure
      const reviewDoc = {
        restroomId: reviewData.restroomId,
        restroomName: reviewData.restroomName || '',
        userId: reviewData.userId || 'anonymous',
        userName: reviewData.userName || 'Anonymous User',
        ratings: {
          cleanliness: ratings.cleanliness,
          supplies: ratings.supplies,
          accessibility: ratings.accessibility,
          waitTime: ratings.waitTime,
        },
        averageRating: averageRating,
        reviewText: reviewData.reviewText || '',
        helpful: 0,
        createdAt: serverTimestamp(),
      };

      // Add the review
      const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
      transaction.set(reviewRef, reviewDoc);

      // Update restroom with new averages
      transaction.update(restroomRef, {
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
        cleanliness: Math.round(newCleanliness * 10) / 10,
        reviews: newReviewCount,
      });

      console.log('[ReviewService] Review added with 4-category ratings:', {
        ratings: ratings,
        averageRating: averageRating,
        newRestroomRating: newRating.toFixed(1),
        reviewCount: newReviewCount,
      });

      return { id: reviewRef.id };
    });

    console.log('[ReviewService] Review submitted successfully:', result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[ReviewService] Error submitting review:', error);
    return { success: false, error: error.message || 'Failed to submit review' };
  }
};

/**
 * Fetch reviews for a restroom
 * @param {string} restroomId - The restroom ID
 * @param {number} limitCount - Maximum number of reviews to fetch
 * @returns {Promise<Array>} Array of reviews
 */
export const fetchReviews = async (restroomId, limitCount = 10) => {
  console.log('[ReviewService] Fetching reviews for restroom:', restroomId);

  if (!isFirebaseConfigured()) {
    console.log('[ReviewService] Firebase not configured, returning empty array');
    return [];
  }

  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where('restroomId', '==', restroomId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    console.log('[ReviewService] Fetched', reviews.length, 'reviews');
    return reviews;
  } catch (error) {
    console.error('[ReviewService] Error fetching reviews:', error);
    return [];
  }
};

/**
 * Subscribe to real-time review updates for a restroom
 * @param {string} restroomId - The restroom ID
 * @param {Function} callback - Called with updated reviews array
 * @param {number} limitCount - Maximum number of reviews
 * @returns {Function} Unsubscribe function
 */
export const subscribeToReviews = (restroomId, callback, limitCount = 10) => {
  if (!isFirebaseConfigured()) {
    callback([]);
    return () => {};
  }

  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where('restroomId', '==', restroomId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        callback(reviews);
      },
      (error) => {
        console.error('[ReviewService] Subscription error:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('[ReviewService] Error setting up subscription:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Get review count for a restroom
 * @param {string} restroomId - The restroom ID
 * @returns {Promise<number>} Review count
 */
export const getReviewCount = async (restroomId) => {
  if (!isFirebaseConfigured()) {
    return 0;
  }

  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(reviewsRef, where('restroomId', '==', restroomId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('[ReviewService] Error getting review count:', error);
    return 0;
  }
};
