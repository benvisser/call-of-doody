/**
 * Migration Script: Add Bathroom Types to Existing Restrooms
 *
 * This script adds the new bathroomTypes array field to existing restrooms
 * by inferring types from the legacy 'gender' field and restroom type.
 *
 * Run with: node scripts/migrateBathroomTypes.js
 */

const { db } = require('./firebase-config.js');
const { collection, getDocs, updateDoc, doc } = require('firebase/firestore');

/**
 * Infer bathroom types from legacy gender field and restroom context
 */
function inferBathroomTypes(restroom) {
  const { gender, type, name } = restroom;

  // If already has bathroomTypes, return them
  if (restroom.bathroomTypes && restroom.bathroomTypes.length > 0) {
    return restroom.bathroomTypes;
  }

  // Infer from legacy gender field
  if (gender === 'unisex') {
    return ['all_gender'];
  }

  if (gender === 'separate') {
    return ['mens', 'womens'];
  }

  if (gender === 'mens') {
    return ['mens'];
  }

  if (gender === 'womens') {
    return ['womens'];
  }

  if (gender === 'family') {
    return ['family'];
  }

  // Infer from restroom type or name
  const nameLower = (name || '').toLowerCase();

  // Small venues often have single all-gender restrooms
  if (type === 'cafe' || type === 'gas_station' || nameLower.includes('coffee')) {
    return ['all_gender'];
  }

  // Large venues usually have all types
  if (type === 'shopping_mall' || type === 'airport' || type === 'convention_center' ||
      type === 'library' || type === 'museum' || type === 'stadium') {
    return ['mens', 'womens', 'family'];
  }

  // Parks usually have basic facilities
  if (type === 'park') {
    return ['mens', 'womens'];
  }

  // Default: assume separate men's and women's
  return ['mens', 'womens'];
}

/**
 * Main migration function
 */
async function migrateBathroomTypes() {
  console.log('🔄 Adding bathroom types to existing restrooms...\n');

  const snapshot = await getDocs(collection(db, 'restrooms'));

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`Found ${snapshot.size} restrooms to process.\n`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const restroomId = docSnap.id;

    try {
      // Skip if already has bathroom types
      if (data.bathroomTypes && data.bathroomTypes.length > 0) {
        console.log(`⏭️  Skipping "${data.name}" (already has bathroomTypes)`);
        skipped++;
        continue;
      }

      // Infer bathroom types
      const bathroomTypes = inferBathroomTypes(data);

      // Update restroom document
      await updateDoc(doc(db, 'restrooms', restroomId), {
        bathroomTypes,
        updatedAt: new Date(),
      });

      migrated++;
      console.log(`✓ Migrated: "${data.name}" → [${bathroomTypes.join(', ')}]`);

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
}

// Run migration
migrateBathroomTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
