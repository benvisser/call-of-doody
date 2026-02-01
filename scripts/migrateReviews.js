#!/usr/bin/env node
/**
 * Sample Reviews Migration Script for Node.js
 *
 * Usage: node scripts/migrateReviews.js
 *
 * This script uploads sample review data to Firestore for testing.
 * Make sure you have a .env file with Firebase credentials.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, Timestamp } = require('firebase/firestore');
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
  console.error('See docs/FIREBASE_SETUP.md for instructions.');
  process.exit(1);
}

// Sample review texts for variety
const positiveReviews = [
  "Super clean and well-maintained! Would definitely stop here again.",
  "Great spot! Everything worked perfectly and it was spotless.",
  "Exceeded expectations. The hand dryers actually work!",
  "One of the best public restrooms I've found. Keep up the good work!",
  "Clean, accessible, and didn't have to wait. What more could you ask for?",
  "Finally, a restroom that doesn't make me question my life choices.",
  "Pleasantly surprised! Very well kept.",
  "The changing table was clean and sturdy. Parents will appreciate this place.",
];

const neutralReviews = [
  "Gets the job done. Nothing fancy but acceptable.",
  "Decent enough for a quick stop. Could use some air freshener.",
  "It's okay. Not great, not terrible.",
  "Standard public restroom. Met expectations.",
  "Functional but could be cleaner. Soap dispensers were working at least.",
  "Average experience. The toilet paper was a bit thin.",
];

const negativeReviews = [
  "Needs some attention from management. Out of paper towels.",
  "Not the cleanest but better than nothing in an emergency.",
  "Would avoid if possible but works in a pinch.",
  "The hand dryer was broken and there were no paper towels. Bring your own!",
  "Could really use a deep clean. At least there was soap.",
];

const userNames = [
  "Bathroom Critic", "Road Tripper", "Local Explorer", "Restroom Reviewer",
  "Flush Finder", "Throne Seeker", "Potty Patrol", "Loo Hunter",
  "Restroom Ranger", "Pit Stop Pro", "Anonymous User"
];

// Generate a random date within the last 90 days
function getRandomPastDate(daysAgo = 90) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  now.setDate(now.getDate() - randomDays);
  now.setHours(now.getHours() - randomHours);
  now.setMinutes(now.getMinutes() - randomMinutes);
  return now;
}

// Generate sample reviews for a restroom
function generateReviewsForRestroom(restroomId, restroomName, avgRating, avgCleanliness, count) {
  const reviews = [];

  for (let i = 0; i < count; i++) {
    // Generate rating centered around the restroom's average (with some variance)
    const ratingVariance = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    let rating = Math.round(avgRating) + ratingVariance;
    rating = Math.max(1, Math.min(5, rating)); // Clamp between 1-5

    const cleanlinessVariance = Math.floor(Math.random() * 3) - 1;
    let cleanliness = Math.round(avgCleanliness) + cleanlinessVariance;
    cleanliness = Math.max(1, Math.min(5, cleanliness));

    // Select appropriate review text based on rating
    let reviewText = '';
    const hasText = Math.random() > 0.3; // 70% chance of having text

    if (hasText) {
      if (rating >= 4) {
        reviewText = positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
      } else if (rating >= 3) {
        reviewText = neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
      } else {
        reviewText = negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
      }
    }

    reviews.push({
      id: `${restroomId}_review_${i + 1}`,
      restroomId: restroomId,
      userId: 'anonymous',
      userName: userNames[Math.floor(Math.random() * userNames.length)],
      rating: rating,
      cleanliness: cleanliness,
      reviewText: reviewText,
      helpful: Math.floor(Math.random() * 15), // 0-14 helpful votes
      createdAt: getRandomPastDate(),
    });
  }

  // Sort by date (newest first)
  reviews.sort((a, b) => b.createdAt - a.createdAt);

  return reviews;
}

// Restroom data for generating reviews
const restroomData = [
  { id: '1', name: 'York Public Library', rating: 4.5, cleanliness: 5, reviewCount: 5 },
  { id: '2', name: 'Starbucks - York', rating: 3.8, cleanliness: 3, reviewCount: 4 },
  { id: '3', name: "McDonald's York", rating: 3.5, cleanliness: 3, reviewCount: 6 },
  { id: '4', name: 'Walmart Supercenter York', rating: 4.0, cleanliness: 4, reviewCount: 5 },
  { id: '5', name: 'York County Government Center', rating: 4.3, cleanliness: 5, reviewCount: 4 },
  { id: '6', name: 'Olive Garden York', rating: 4.2, cleanliness: 4, reviewCount: 5 },
  { id: '7', name: 'CVS Pharmacy York', rating: 3.7, cleanliness: 3, reviewCount: 3 },
  { id: '8', name: 'York Comprehensive High School', rating: 4.1, cleanliness: 4, reviewCount: 4 },
  { id: '9', name: 'Food Lion York', rating: 3.9, cleanliness: 4, reviewCount: 4 },
  { id: '10', name: 'Bojangles York', rating: 3.6, cleanliness: 3, reviewCount: 5 },
];

async function migrateReviews() {
  console.log('🚀 Starting Reviews migration...\n');
  console.log(`📦 Firebase Project: ${firebaseConfig.projectId}`);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const reviewsRef = collection(db, 'reviews');

  // Check existing reviews
  const existingDocs = await getDocs(reviewsRef);
  const existingIds = new Set(existingDocs.docs.map(doc => doc.id));

  if (!existingDocs.empty) {
    console.log(`⚠️  Found ${existingDocs.size} existing reviews in Firestore.`);
    console.log('   Skipping duplicates (matching by ID)...\n');
  }

  let uploaded = 0;
  let skipped = 0;
  let total = 0;

  for (const restroom of restroomData) {
    console.log(`\n📍 Generating reviews for: ${restroom.name}`);

    const reviews = generateReviewsForRestroom(
      restroom.id,
      restroom.name,
      restroom.rating,
      restroom.cleanliness,
      restroom.reviewCount
    );

    total += reviews.length;

    for (const review of reviews) {
      if (existingIds.has(review.id)) {
        console.log(`   ⏭️  Skipping review ${review.id} (already exists)`);
        skipped++;
        continue;
      }

      try {
        const docRef = doc(reviewsRef, review.id);
        await setDoc(docRef, {
          restroomId: review.restroomId,
          userId: review.userId,
          userName: review.userName,
          rating: review.rating,
          cleanliness: review.cleanliness,
          reviewText: review.reviewText,
          helpful: review.helpful,
          createdAt: Timestamp.fromDate(review.createdAt),
        });
        console.log(`   ✅ Uploaded: ★${review.rating} review by ${review.userName}`);
        uploaded++;
      } catch (error) {
        console.error(`   ❌ Failed: ${review.id} - ${error.message}`);
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Uploaded: ${uploaded}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total reviews generated: ${total}`);
  console.log(`   📍 Total in Firestore: ${existingDocs.size + uploaded}`);
  console.log('\n✨ Reviews migration complete!');

  process.exit(0);
}

migrateReviews().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
