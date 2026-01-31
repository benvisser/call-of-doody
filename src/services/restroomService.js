import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, isConfigured } from '../config/firebase.js';
import { mockRestrooms } from '../data/mockData.js';

const RESTROOMS_COLLECTION = 'restrooms';

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
