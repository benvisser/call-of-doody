/**
 * Migration Script: Upload mock restrooms to Firestore
 *
 * This script uploads all mock restroom data to your Firestore database.
 * Run this once after setting up Firebase to populate your database.
 *
 * Usage:
 * 1. Make sure Firebase is configured in .env
 * 2. Import and call migrateRestroomsToFirestore() from your app
 *    Or run via a temporary button/screen during development
 *
 * Example:
 *   import { migrateRestroomsToFirestore } from './src/utils/migrateData';
 *   migrateRestroomsToFirestore().then(() => console.log('Done!'));
 */

import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from '../config/firebase.js';
import { mockRestrooms } from '../data/mockData.js';

const RESTROOMS_COLLECTION = 'restrooms';

/**
 * Check if migration has already been done
 */
export const checkMigrationStatus = async () => {
  if (!isConfigured || !db) {
    console.error('Firebase not configured. Check your .env file.');
    return { migrated: false, count: 0, error: 'Firebase not configured' };
  }

  try {
    const restroomsRef = collection(db, RESTROOMS_COLLECTION);
    const snapshot = await getDocs(restroomsRef);
    return {
      migrated: !snapshot.empty,
      count: snapshot.size,
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { migrated: false, count: 0, error };
  }
};

/**
 * Migrate all mock restrooms to Firestore
 * @param {boolean} force - If true, upload even if data exists
 * @returns {Promise<{success: boolean, count: number, error?: Error}>}
 */
export const migrateRestroomsToFirestore = async (force = false) => {
  if (!isConfigured || !db) {
    console.error('Firebase not configured. Check your .env file.');
    console.error('Required variables: EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_API_KEY');
    return { success: false, count: 0, error: 'Firebase not configured' };
  }

  try {
    // Check if already migrated
    if (!force) {
      const status = await checkMigrationStatus();
      if (status.migrated) {
        console.log(`Migration already complete. ${status.count} restrooms exist.`);
        return { success: true, count: status.count, alreadyMigrated: true };
      }
    }

    console.log(`Starting migration of ${mockRestrooms.length} restrooms...`);

    const restroomsRef = collection(db, RESTROOMS_COLLECTION);
    let successCount = 0;

    for (const restroom of mockRestrooms) {
      try {
        // Use the mock ID as the document ID for consistency
        const docRef = doc(restroomsRef, restroom.id);

        await setDoc(docRef, {
          name: restroom.name,
          latitude: restroom.latitude,
          longitude: restroom.longitude,
          rating: restroom.rating,
          cleanliness: restroom.cleanliness,
          amenities: restroom.amenities,
          gender: restroom.gender,
          reviews: restroom.reviews,
          address: restroom.address,
          isPrivate: restroom.isPrivate || false,
          imageUrl: restroom.imageUrl || '',
          createdAt: serverTimestamp(),
        });

        successCount++;
        console.log(`Uploaded: ${restroom.name}`);
      } catch (error) {
        console.error(`Failed to upload ${restroom.name}:`, error);
      }
    }

    console.log(`Migration complete! ${successCount}/${mockRestrooms.length} restrooms uploaded.`);

    return {
      success: successCount === mockRestrooms.length,
      count: successCount,
      total: mockRestrooms.length,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, count: 0, error };
  }
};

/**
 * Delete all restrooms from Firestore (use with caution!)
 */
export const clearRestroomsCollection = async () => {
  try {
    const restroomsRef = collection(db, RESTROOMS_COLLECTION);
    const snapshot = await getDocs(restroomsRef);

    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    console.log(`Deleted ${snapshot.size} restrooms`);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error clearing collection:', error);
    return { success: false, error };
  }
};
