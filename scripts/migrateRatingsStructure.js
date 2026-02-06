/**
 * Migration Script: Migrate Restroom Ratings to 4-Category Structure
 *
 * This script updates existing restrooms to use the new 4-category rating system:
 * - ratings: { cleanliness, supplies, accessibility, waitTime }
 * - rating: overall average
 * - reviewCount: replaces "reviews" field
 *
 * Run with: node scripts/migrateRatingsStructure.js
 */

const { db } = require('./firebase-config.js');
const { collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

/**
 * Calculate average ratings from all reviews for a restroom
 */
async function calculateRatingsFromReviews(restroomId) {
  const reviewsQuery = query(
    collection(db, 'reviews'),
    where('restroomId', '==', restroomId)
  );

  const snapshot = await getDocs(reviewsQuery);

  if (snapshot.empty) {
    return {
      ratings: { cleanliness: 0, supplies: 0, accessibility: 0, waitTime: 0 },
      rating: 0,
      reviewCount: 0,
    };
  }

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

    // Handle new format (ratings object)
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

  const avgCleanliness = cleanlinessCount > 0 ? totalCleanliness / cleanlinessCount : 0;
  const avgSupplies = suppliesCount > 0 ? totalSupplies / suppliesCount : 0;
  const avgAccessibility = accessibilityCount > 0 ? totalAccessibility / accessibilityCount : 0;
  const avgWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;

  // Overall rating is average of non-zero categories
  const validRatings = [avgCleanliness, avgSupplies, avgAccessibility, avgWaitTime].filter(r => r > 0);
  const overallRating = validRatings.length > 0
    ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
    : 0;

  return {
    ratings: {
      cleanliness: Number(avgCleanliness.toFixed(2)),
      supplies: Number(avgSupplies.toFixed(2)),
      accessibility: Number(avgAccessibility.toFixed(2)),
      waitTime: Number(avgWaitTime.toFixed(2)),
    },
    rating: Number(overallRating.toFixed(2)),
    reviewCount: snapshot.size,
  };
}

/**
 * Main migration function
 */
async function migrateRatingsStructure() {
  console.log('🔄 Starting ratings structure migration...\n');

  const snapshot = await getDocs(collection(db, 'restrooms'));

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`Found ${snapshot.size} restrooms to process.\n`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const restroomId = docSnap.id;

    try {
      // Check if already has new structure
      if (data.ratings && typeof data.ratings === 'object' && data.ratings.cleanliness !== undefined) {
        console.log(`⏭️  Skipping "${data.name}" (already migrated)`);
        skipped++;
        continue;
      }

      // Calculate ratings from reviews
      const calculatedRatings = await calculateRatingsFromReviews(restroomId);

      // If no reviews, use existing cleanliness value if available
      if (calculatedRatings.reviewCount === 0 && data.cleanliness > 0) {
        calculatedRatings.ratings.cleanliness = data.cleanliness;
        calculatedRatings.rating = data.cleanliness;
      }

      // Prepare update
      const updates = {
        ratings: calculatedRatings.ratings,
        rating: calculatedRatings.rating,
        reviewCount: calculatedRatings.reviewCount || data.reviews || 0,
        updatedAt: new Date(),
      };

      // Update restroom document
      await updateDoc(doc(db, 'restrooms', restroomId), updates);

      migrated++;
      console.log(`✓ Migrated: "${data.name}"`);
      console.log(`   Rating: ${updates.rating.toFixed(1)} (${updates.reviewCount} reviews)`);
      if (updates.ratings.cleanliness > 0) {
        console.log(`   Cleanliness: ${updates.ratings.cleanliness.toFixed(1)}`);
      }

    } catch (error) {
      errors++;
      console.error(`✗ Error migrating "${data.name}": ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✓ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ✗ Errors: ${errors}`);
  console.log('='.repeat(50));

  if (errors > 0) {
    console.log('\n⚠️  Some restrooms had errors. Review logs above.');
  }

  console.log('\n✅ Migration complete!');
  console.log('\nNote: Old "reviews" and individual rating fields are preserved.');
  console.log('You can manually clean these up in Firebase Console if desired.\n');
}

// Run migration
migrateRatingsStructure()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
