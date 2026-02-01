#!/usr/bin/env node
/**
 * Add Test Reviews Script
 *
 * Usage: node scripts/addTestReviews.js
 *
 * This script adds test reviews with the 4-category rating system.
 * Run this after manually deleting reviews from Firebase Console.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your_project_id') {
  console.error('❌ Firebase not configured!');
  console.error('Please update your .env file with Firebase credentials.');
  process.exit(1);
}

// Funny test reviews with 4-category ratings
const testReviews = [
  // York Public Library (id: 1)
  {
    restroomId: '1',
    userId: 'user_bookworm',
    userName: 'BookWorm42',
    ratings: { cleanliness: 5, supplies: 5, accessibility: 5, waitTime: 5 },
    averageRating: 5.0,
    reviewText: 'Finally, a throne worthy of finishing my chapter. Quiet, clean, and nobody judges you for being in there 20 minutes.',
    helpful: 24,
  },
  {
    restroomId: '1',
    userId: 'user_desperate',
    userName: 'DesperateDan',
    ratings: { cleanliness: 5, supplies: 4, accessibility: 5, waitTime: 4 },
    averageRating: 4.5,
    reviewText: 'Ran in during a book club emergency. 10/10 would panic-poop again.',
    helpful: 18,
  },
  // Starbucks (id: 2)
  {
    restroomId: '2',
    userId: 'user_caffeine',
    userName: 'CaffeineQueen',
    ratings: { cleanliness: 3, supplies: 3, accessibility: 3, waitTime: 2 },
    averageRating: 2.8,
    reviewText: 'The coffee works fast. The line for this bathroom works slow. Do the math.',
    helpful: 31,
  },
  // McDonald's (id: 3)
  {
    restroomId: '3',
    userId: 'user_mclovin',
    userName: 'McLovinIt',
    ratings: { cleanliness: 3, supplies: 2, accessibility: 4, waitTime: 4 },
    averageRating: 3.3,
    reviewText: 'The McRib giveth, and the McRib taketh away. This bathroom has seen things.',
    helpful: 42,
  },
  {
    restroomId: '3',
    userId: 'user_roadtrip',
    userName: 'RoadTripKing',
    ratings: { cleanliness: 4, supplies: 3, accessibility: 4, waitTime: 5 },
    averageRating: 4.0,
    reviewText: 'Perfect pit stop. In and out faster than the drive-thru line.',
    helpful: 15,
  },
  // Walmart (id: 4)
  {
    restroomId: '4',
    userId: 'user_survivor',
    userName: 'WalmartSurvivor',
    ratings: { cleanliness: 3, supplies: 4, accessibility: 5, waitTime: 2 },
    averageRating: 3.5,
    reviewText: 'Went in for milk. Hour later I needed this bathroom. Classic Walmart trap.',
    helpful: 56,
  },
  {
    restroomId: '4',
    userId: 'user_dadlife',
    userName: 'DadLife247',
    ratings: { cleanliness: 4, supplies: 5, accessibility: 5, waitTime: 4 },
    averageRating: 4.5,
    reviewText: 'Family restroom saved my life. Changed a diaper AND had a moment of peace. Legendary.',
    helpful: 33,
  },
  // Government Center (id: 5)
  {
    restroomId: '5',
    userId: 'user_taxdude',
    userName: 'TaxPayerTed',
    ratings: { cleanliness: 5, supplies: 5, accessibility: 5, waitTime: 5 },
    averageRating: 5.0,
    reviewText: 'My tax dollars finally went somewhere useful. Immaculate throne room.',
    helpful: 28,
  },
  // Olive Garden (id: 6)
  {
    restroomId: '6',
    userId: 'user_breadstick',
    userName: 'BreadstickBandit',
    ratings: { cleanliness: 4, supplies: 4, accessibility: 4, waitTime: 3 },
    averageRating: 3.8,
    reviewText: 'When youre here, youre family. When youre in here, youre alone with regret and unlimited breadsticks.',
    helpful: 47,
  },
  // Bojangles (id: 10)
  {
    restroomId: '10',
    userId: 'user_biscuit',
    userName: 'BiscuitBoss',
    ratings: { cleanliness: 3, supplies: 3, accessibility: 4, waitTime: 4 },
    averageRating: 3.5,
    reviewText: 'Bo-time is all the time, including bathroom time. Solid experience.',
    helpful: 19,
  },
];

async function addTestReviews() {
  console.log('🚀 Adding test reviews...\n');
  console.log(`📦 Firebase Project: ${firebaseConfig.projectId}\n`);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('📝 Adding reviews with 4-category ratings...');

  let added = 0;
  for (const review of testReviews) {
    try {
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, {
        ...review,
        createdAt: serverTimestamp(),
      });
      console.log(`   ✅ Added review by ${review.userName} for restroom ${review.restroomId}`);
      added++;
    } catch (error) {
      console.error(`   ❌ Failed to add review: ${error.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Added: ${added} new reviews`);
  console.log('\n✨ Done!');

  process.exit(0);
}

addTestReviews().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
