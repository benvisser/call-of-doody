#!/usr/bin/env node
/**
 * Reset Reviews Script
 *
 * Usage: node scripts/resetReviews.js
 *
 * This script deletes all existing reviews and adds new test data
 * with the 4-category rating system (cleanliness, supplies, accessibility, waitTime).
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp } = require('firebase/firestore');
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

// Test reviews with 4-category ratings
const testReviews = [
  // Reviews for York Public Library (id: 1)
  {
    restroomId: '1',
    userId: 'user_jane',
    userName: 'Jane D.',
    ratings: { cleanliness: 5, supplies: 5, accessibility: 5, waitTime: 5 },
    averageRating: 5.0,
    reviewText: 'Spotless! Best public restroom in York. Always clean and well-stocked.',
    helpful: 12,
  },
  {
    restroomId: '1',
    userId: 'user_mike',
    userName: 'Mike R.',
    ratings: { cleanliness: 4, supplies: 4, accessibility: 5, waitTime: 4 },
    averageRating: 4.3,
    reviewText: 'Great accessibility features. Spacious and clean.',
    helpful: 8,
  },
  // Reviews for Starbucks (id: 2)
  {
    restroomId: '2',
    userId: 'user_sarah',
    userName: 'Sarah K.',
    ratings: { cleanliness: 3, supplies: 4, accessibility: 3, waitTime: 3 },
    averageRating: 3.3,
    reviewText: 'Decent for a coffee shop. Sometimes have to wait.',
    helpful: 5,
  },
  {
    restroomId: '2',
    userId: 'user_tom',
    userName: 'Tom B.',
    ratings: { cleanliness: 4, supplies: 3, accessibility: 4, waitTime: 4 },
    averageRating: 3.8,
    reviewText: 'Clean but small. Only one stall.',
    helpful: 3,
  },
  // Reviews for McDonald's (id: 3)
  {
    restroomId: '3',
    userId: 'user_alex',
    userName: 'Alex M.',
    ratings: { cleanliness: 3, supplies: 3, accessibility: 4, waitTime: 4 },
    averageRating: 3.5,
    reviewText: 'Standard fast food restroom. Gets busy during lunch.',
    helpful: 7,
  },
  {
    restroomId: '3',
    userId: 'user_chris',
    userName: 'Chris L.',
    ratings: { cleanliness: 4, supplies: 2, accessibility: 4, waitTime: 3 },
    averageRating: 3.3,
    reviewText: 'Paper towels were out when I visited. Otherwise okay.',
    helpful: 2,
  },
  // Reviews for Walmart (id: 4)
  {
    restroomId: '4',
    userId: 'user_kim',
    userName: 'Kim P.',
    ratings: { cleanliness: 4, supplies: 4, accessibility: 5, waitTime: 3 },
    averageRating: 4.0,
    reviewText: 'Family restroom is a lifesaver! Great changing table.',
    helpful: 15,
  },
  {
    restroomId: '4',
    userId: 'user_david',
    userName: 'David W.',
    ratings: { cleanliness: 4, supplies: 5, accessibility: 5, waitTime: 4 },
    averageRating: 4.5,
    reviewText: 'Multiple stalls so no wait. Always stocked.',
    helpful: 9,
  },
  {
    restroomId: '4',
    userId: 'user_emily',
    userName: 'Emily H.',
    ratings: { cleanliness: 3, supplies: 4, accessibility: 4, waitTime: 3 },
    averageRating: 3.5,
    reviewText: 'Can be hit or miss depending on time of day.',
    helpful: 4,
  },
  // Reviews for Government Center (id: 5)
  {
    restroomId: '5',
    userId: 'user_robert',
    userName: 'Robert J.',
    ratings: { cleanliness: 5, supplies: 4, accessibility: 5, waitTime: 5 },
    averageRating: 4.8,
    reviewText: 'Government buildings always keep it clean. No wait!',
    helpful: 6,
  },
  // Reviews for Olive Garden (id: 6)
  {
    restroomId: '6',
    userId: 'user_lisa',
    userName: 'Lisa T.',
    ratings: { cleanliness: 4, supplies: 4, accessibility: 4, waitTime: 4 },
    averageRating: 4.0,
    reviewText: 'Nice restaurant-quality restroom. Clean and spacious.',
    helpful: 11,
  },
  {
    restroomId: '6',
    userId: 'user_mark',
    userName: 'Mark S.',
    ratings: { cleanliness: 5, supplies: 4, accessibility: 4, waitTime: 5 },
    averageRating: 4.5,
    reviewText: 'Always impressed with how clean they keep it.',
    helpful: 8,
  },
];

async function resetReviews() {
  console.log('🚀 Starting reviews reset...\n');
  console.log(`📦 Firebase Project: ${firebaseConfig.projectId}\n`);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const reviewsRef = collection(db, 'reviews');

  // Step 1: Delete all existing reviews
  console.log('🗑️  Deleting existing reviews...');
  const existingReviews = await getDocs(reviewsRef);

  let deleted = 0;
  for (const reviewDoc of existingReviews.docs) {
    await deleteDoc(doc(db, 'reviews', reviewDoc.id));
    deleted++;
  }
  console.log(`   Deleted ${deleted} reviews\n`);

  // Step 2: Add new test reviews
  console.log('📝 Adding new test reviews with 4-category ratings...');

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
  console.log(`   🗑️  Deleted: ${deleted} old reviews`);
  console.log(`   ✅ Added: ${added} new reviews`);
  console.log('\n✨ Reviews reset complete!');

  process.exit(0);
}

resetReviews().catch(error => {
  console.error('❌ Reset failed:', error);
  process.exit(1);
});
