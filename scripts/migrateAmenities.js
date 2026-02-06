#!/usr/bin/env node
/**
 * Amenities Migration Script
 *
 * Migrates existing restrooms from old amenities array format
 * to new voting structure format.
 *
 * Usage: node scripts/migrateAmenities.js
 */

const { db } = require('./firebase-config');
const { collection, getDocs, updateDoc, doc } = require('firebase/firestore');

/**
 * Convert old amenity ID to new ID if needed
 */
function mapLegacyAmenityId(oldId) {
  const mapping = {
    // Map old IDs to new IDs from constants/amenities.js
    'accessible': 'wheelchair_accessible',
    'family': 'family_restroom',
    'family_room': 'family_restroom',
    'sinks': 'soap', // Assume sinks means soap available
    'toilets': 'toilet_paper',
    'urinals': 'multiple_stalls',
    'single_stall': 'single_occupancy',
  };

  return mapping[oldId] || oldId;
}

/**
 * Convert old amenities array to new voting structure
 */
function convertToVotingStructure(oldAmenities) {
  const amenities = {};

  // Handle array format (old structure)
  if (Array.isArray(oldAmenities)) {
    oldAmenities.forEach(amenityId => {
      const newId = mapLegacyAmenityId(amenityId);
      amenities[newId] = {
        votes: 0,
        confirmVotes: 0,
        denyVotes: 0,
        percentage: 0,
        status: 'unverified',
        lastUpdated: new Date(),
      };
    });
  }
  // Handle object format (already migrated or partial migration)
  else if (typeof oldAmenities === 'object' && oldAmenities !== null) {
    // Check if it's already in the new format
    const firstValue = Object.values(oldAmenities)[0];
    if (firstValue && typeof firstValue === 'object' && 'votes' in firstValue) {
      // Already in new format, return as-is
      return oldAmenities;
    }

    // Otherwise convert from some other object format
    Object.keys(oldAmenities).forEach(amenityId => {
      const newId = mapLegacyAmenityId(amenityId);
      amenities[newId] = {
        votes: 0,
        confirmVotes: 0,
        denyVotes: 0,
        percentage: 0,
        status: 'unverified',
        lastUpdated: new Date(),
      };
    });
  }

  return amenities;
}

async function migrateExistingRestrooms() {
  console.log('🔄 Migrating existing restrooms to amenities voting structure...\n');

  const snapshot = await getDocs(collection(db, 'restrooms'));
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    try {
      // Check if already in new format
      if (data.amenities && typeof data.amenities === 'object' && !Array.isArray(data.amenities)) {
        const firstValue = Object.values(data.amenities)[0];
        if (firstValue && typeof firstValue === 'object' && 'votes' in firstValue) {
          console.log(`⏭️  Skipping ${data.name} (already migrated)`);
          skipped++;
          continue;
        }
      }

      // Convert old amenities to new structure
      const oldAmenities = data.amenities || [];
      const newAmenities = convertToVotingStructure(oldAmenities);

      await updateDoc(doc(db, 'restrooms', docSnap.id), {
        amenities: newAmenities,
        confirmedAmenities: [],
        updatedAt: new Date(),
      });

      migrated++;
      console.log(`✓ Migrated: ${data.name}`);

    } catch (error) {
      errors++;
      console.error(`✗ Error migrating ${data.name}: ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 Migration Summary:');
  console.log(`   ✓ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ✗ Errors: ${errors}`);
  console.log(`   📍 Total: ${snapshot.size}`);
  console.log('═══════════════════════════════════════════\n');

  if (migrated > 0) {
    console.log('✅ Migration complete!');
  } else if (skipped === snapshot.size) {
    console.log('✅ All restrooms already migrated!');
  }

  process.exit(errors > 0 ? 1 : 0);
}

migrateExistingRestrooms().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
