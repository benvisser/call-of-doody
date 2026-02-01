import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured, AUTO_APPROVE_SUBMISSIONS } from '../config/firebase.js';
import { mockRestrooms } from '../data/mockData.js';

const RESTROOMS_COLLECTION = 'restrooms';
const PENDING_COLLECTION = 'pending_restrooms';

// Cache for offline support
let cachedRestrooms = null;

/**
 * Check if Firebase is properly configured
 */
const isFirebaseConfigured = () => {
  if (!isConfigured) {
    console.warn('Firebase not configured. Set EXPO_PUBLIC_FIREBASE_PROJECT_ID in .env');
  }
  return isConfigured && db !== null;
};

// TODO: For production with many locations, implement geo-queries
// using GeoFirestore or filter by map bounds for better performance

/**
 * Fetch all restrooms from Firestore
 * Falls back to mock data if Firebase is not configured or on error
 */
export const fetchRestrooms = async () => {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, using mock data');
    return mockRestrooms;
  }

  try {
    const restroomsRef = collection(db, RESTROOMS_COLLECTION);
    const q = query(restroomsRef, orderBy('name'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No restrooms in Firestore, using mock data');
      return mockRestrooms;
    }

    const restrooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cache for offline use
    cachedRestrooms = restrooms;
    return restrooms;
  } catch (error) {
    console.error('Error fetching restrooms:', error);
    // Return cached data if available, otherwise mock data
    return cachedRestrooms || mockRestrooms;
  }
};

/**
 * Subscribe to real-time restroom updates
 * @param {Function} callback - Called with updated restrooms array
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRestrooms = (callback, onError) => {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, using mock data');
    callback(mockRestrooms);
    return () => {}; // No-op unsubscribe
  }

  try {
    const restroomsRef = collection(db, RESTROOMS_COLLECTION);
    const q = query(restroomsRef, orderBy('name'));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          console.log('No restrooms in Firestore. Run: node scripts/migrate.js');
          console.log('Falling back to mock data...');
          callback(mockRestrooms);
          return;
        }

        const restrooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`Loaded ${restrooms.length} restrooms from Firestore`);

        // Cache for offline use
        cachedRestrooms = restrooms;
        callback(restrooms);
      },
      (error) => {
        console.error('Realtime listener error:', error);
        if (onError) {
          onError(error);
        }
        // Fall back to cached or mock data
        callback(cachedRestrooms || mockRestrooms);
      }
    );
  } catch (error) {
    console.error('Error setting up listener:', error);
    callback(mockRestrooms);
    return () => {};
  }
};

/**
 * Fetch restrooms within map bounds (for performance optimization)
 * Note: Firestore doesn't support native geo-queries, so this filters client-side
 * For production, consider using GeoFirestore or a similar solution
 */
export const fetchRestroomsInBounds = async (bounds) => {
  const allRestrooms = await fetchRestrooms();

  if (!bounds) return allRestrooms;

  const { northEast, southWest } = bounds;

  return allRestrooms.filter((restroom) => {
    const { latitude, longitude } = restroom;
    return (
      latitude >= southWest.latitude &&
      latitude <= northEast.latitude &&
      longitude >= southWest.longitude &&
      longitude <= northEast.longitude
    );
  });
};

/**
 * Get cached restrooms (for offline support)
 */
export const getCachedRestrooms = () => {
  return cachedRestrooms || mockRestrooms;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<*>} Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, operationName = 'operation') => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[RestroomService] ${operationName} attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry permission errors - they won't succeed
      if (error.code === 'permission-denied') {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[RestroomService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

/**
 * Add a new restroom to Firestore
 * If AUTO_APPROVE_SUBMISSIONS is true, adds directly to restrooms collection
 * Otherwise, adds to pending_restrooms for moderation
 * @param {Object} restroomData - The restroom data to add
 * @returns {Promise<{success: boolean, id?: string, error?: string, autoApproved: boolean}>}
 */
export const addRestroom = async (restroomData) => {
  console.log('[RestroomService] addRestroom called');
  console.log('[RestroomService] Firebase configured:', isConfigured);
  console.log('[RestroomService] db instance:', db ? 'present' : 'MISSING');

  if (!isFirebaseConfigured()) {
    console.error('[RestroomService] Firebase not configured - run: eas env:list');
    return {
      success: false,
      error: 'Firebase not configured. Please check app configuration.',
      autoApproved: false,
    };
  }

  try {
    const collection_name = AUTO_APPROVE_SUBMISSIONS
      ? RESTROOMS_COLLECTION
      : PENDING_COLLECTION;

    const dataToAdd = {
      ...restroomData,
      submittedAt: serverTimestamp(),
      submittedBy: 'anonymous', // For now, until auth is implemented
      ...(AUTO_APPROVE_SUBMISSIONS ? {} : { status: 'pending' }),
    };

    console.log(`[RestroomService] Adding to ${collection_name}:`, dataToAdd.name);
    console.log('[RestroomService] Data:', JSON.stringify(dataToAdd, null, 2));

    // Use retry logic for network resilience
    const docRef = await retryWithBackoff(
      () => addDoc(collection(db, collection_name), dataToAdd),
      3,
      'Firestore write'
    );

    console.log(`[RestroomService] SUCCESS! Added with ID: ${docRef.id}`);
    return {
      success: true,
      id: docRef.id,
      autoApproved: AUTO_APPROVE_SUBMISSIONS,
    };
  } catch (error) {
    console.error('[RestroomService] SUBMISSION FAILED');
    console.error('[RestroomService] Error code:', error.code);
    console.error('[RestroomService] Error message:', error.message);
    console.error('[RestroomService] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Provide specific error messages
    let errorMessage = error.message || 'Failed to add restroom';
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Firestore rules may need updating.';
      console.error('[RestroomService] FIX: Update Firestore rules to allow writes. See docs/FIREBASE_SETUP.md');
    } else if (error.code === 'unavailable') {
      errorMessage = 'Service unavailable. Please check your internet connection.';
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
      autoApproved: false,
    };
  }
};

/**
 * Check if auto-approval is enabled
 * @returns {boolean}
 */
export const isAutoApproveEnabled = () => AUTO_APPROVE_SUBMISSIONS;
