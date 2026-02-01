#!/usr/bin/env node
/**
 * Call of Doody - Uptown Charlotte Seeder
 *
 * Seeds 30 high-quality restroom locations in Uptown Charlotte.
 * Uses a mix of hand-curated priority locations and Google Places API.
 *
 * Usage: npm run seed
 */

const { Client } = require('@googlemaps/google-maps-services-js');
const { db, firebaseConfig } = require('./firebase-config');
const {
  collection,
  writeBatch,
  doc,
  getDocs,
  query,
  where,
  setDoc,
} = require('firebase/firestore');

const client = new Client({});

// Uptown Charlotte core area
const UPTOWN_CENTER = {
  lat: 35.2271,
  lng: -80.8431,
};

const RADIUS_METERS = 3218; // 2 miles

// Focus on highest-quality location types only
const PRIORITY_TYPES = [
  'shopping_mall',
  'library',
  'cafe',
  'transit_station',
];

// Top 15 known excellent locations (manually curated)
const PRIORITY_LOCATIONS = [
  {
    name: 'Epicentre Charlotte',
    lat: 35.2265,
    lng: -80.8453,
    type: 'shopping_mall',
    address: '210 E Trade St, Charlotte, NC 28202',
    notes: 'Entertainment complex, multiple clean restrooms',
  },
  {
    name: 'ImaginOn: The Joe & Joan Martin Center',
    lat: 35.2249,
    lng: -80.8389,
    type: 'library',
    address: '300 E 7th St, Charlotte, NC 28202',
    notes: 'Children\'s library, excellent family restrooms with changing tables',
  },
  {
    name: 'Charlotte Main Library',
    lat: 35.2257,
    lng: -80.8384,
    type: 'library',
    address: '310 N Tryon St, Charlotte, NC 28202',
    notes: 'Public library, very clean accessible restrooms',
  },
  {
    name: 'Romare Bearden Park',
    lat: 35.2279,
    lng: -80.8494,
    type: 'park',
    address: '300 S Mint St, Charlotte, NC 28202',
    notes: 'Public park, well-maintained restrooms',
  },
  {
    name: 'Charlotte Transportation Center',
    lat: 35.2269,
    lng: -80.8392,
    type: 'transit_station',
    address: '310 E Trade St, Charlotte, NC 28202',
    notes: 'Bus terminal, public restrooms',
  },
  {
    name: 'Spectrum Center',
    lat: 35.2251,
    lng: -80.8392,
    type: 'stadium',
    address: '333 E Trade St, Charlotte, NC 28202',
    notes: 'Arena, multiple restrooms (event days)',
  },
  {
    name: 'Levine Museum of the New South',
    lat: 35.2261,
    lng: -80.8464,
    type: 'museum',
    address: '200 E 7th St, Charlotte, NC 28202',
    notes: 'Museum, clean accessible restrooms',
  },
  {
    name: 'Discovery Place Science',
    lat: 35.2289,
    lng: -80.8394,
    type: 'museum',
    address: '301 N Tryon St, Charlotte, NC 28202',
    notes: 'Science museum, family-friendly facilities',
  },
  {
    name: 'Starbucks Reserve - South End',
    lat: 35.2119,
    lng: -80.8603,
    type: 'cafe',
    address: '2000 South Blvd, Charlotte, NC 28203',
    notes: 'Premium Starbucks, clean single-occupancy restroom',
  },
  {
    name: 'Whole Foods Market Uptown',
    lat: 35.2205,
    lng: -80.8522,
    type: 'grocery_store',
    address: '1515 S Tryon St, Charlotte, NC 28203',
    notes: 'Grocery store, clean public restrooms',
  },
  {
    name: 'Bank of America Stadium',
    lat: 35.2258,
    lng: -80.8528,
    type: 'stadium',
    address: '800 S Mint St, Charlotte, NC 28202',
    notes: 'NFL stadium, many restrooms (event days)',
  },
  {
    name: 'Charlotte Convention Center',
    lat: 35.2253,
    lng: -80.8437,
    type: 'convention_center',
    address: '501 S College St, Charlotte, NC 28202',
    notes: 'Convention center, multiple accessible restrooms',
  },
  {
    name: '7th Street Public Market',
    lat: 35.2248,
    lng: -80.8310,
    type: 'shopping_mall',
    address: '224 E 7th St, Charlotte, NC 28202',
    notes: 'Food hall, public restrooms',
  },
  {
    name: 'The Green at South End',
    lat: 35.2178,
    lng: -80.8617,
    type: 'park',
    address: '1412 S Tryon St, Charlotte, NC 28203',
    notes: 'Rail Trail park, public restrooms',
  },
  {
    name: 'NASCAR Hall of Fame',
    lat: 35.2215,
    lng: -80.8389,
    type: 'museum',
    address: '400 E M.L.K. Jr Blvd, Charlotte, NC 28202',
    notes: 'Museum, clean family restrooms',
  },
];

/**
 * Generate a simple geohash for location queries
 * Based on the geohash algorithm - precision 9 chars
 */
function generateGeohash(lat, lng) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < 9) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

/**
 * Infer amenities based on location type
 */
function inferAmenities(placeType) {
  const amenities = [];

  switch (placeType) {
    case 'shopping_mall':
      amenities.push('changing_table', 'family_room', 'multiple_stalls', 'accessible', 'hand_dryer');
      break;
    case 'library':
      amenities.push('accessible', 'changing_table', 'family_room', 'gender_neutral');
      break;
    case 'museum':
      amenities.push('accessible', 'changing_table', 'family_room');
      break;
    case 'stadium':
    case 'convention_center':
      amenities.push('accessible', 'multiple_stalls', 'hand_dryer');
      break;
    case 'transit_station':
      amenities.push('accessible', 'multiple_stalls');
      break;
    case 'cafe':
      amenities.push('single_stall', 'paper_towels');
      break;
    case 'grocery_store':
      amenities.push('accessible', 'single_stall');
      break;
    case 'park':
      amenities.push('accessible');
      break;
    default:
      amenities.push('accessible');
  }

  return amenities;
}

/**
 * Check if a location already exists in Firestore
 */
async function checkIfLocationExists(name) {
  const q = query(
    collection(db, 'restrooms'),
    where('name', '==', name)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Get current count of restrooms in database
 */
async function getExistingCount() {
  const snapshot = await getDocs(collection(db, 'restrooms'));
  return snapshot.size;
}

/**
 * Seed the manually curated priority locations
 */
async function seedPriorityLocations() {
  console.log('🎯 Seeding priority locations...');
  let added = 0;

  for (const location of PRIORITY_LOCATIONS) {
    const exists = await checkIfLocationExists(location.name);

    if (exists) {
      console.log(`  ⏭️  Skipping (exists): ${location.name}`);
      continue;
    }

    const restroomRef = doc(collection(db, 'restrooms'));

    try {
      await setDoc(restroomRef, {
        id: restroomRef.id,
        name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        geohash: generateGeohash(location.lat, location.lng),
        address: location.address,
        city: 'Charlotte',
        neighborhood: 'Uptown',
        type: location.type,
        isPublic: true,
        amenities: inferAmenities(location.type),
        rating: 0,
        reviews: 0,
        cleanliness: 0,
        supplies: 0,
        accessibility: 0,
        waitTime: 0,
        imageUrl: null,
        source: 'manual_curated',
        notes: location.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      added++;
      console.log(`  ✓ Added: ${location.name}`);
    } catch (error) {
      console.error(`  ✗ Failed: ${location.name} - ${error.message}`);
    }
  }

  if (added > 0) {
    console.log(`✅ Priority locations complete: ${added} added\n`);
  } else {
    console.log(`✅ All priority locations already exist\n`);
  }

  return added;
}

/**
 * Search Google Places API for additional locations
 */
async function seedFromGooglePlaces(maxLocations = 30) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey || apiKey === 'your_places_api_key_here') {
    console.log('⚠️  Google Places API key not configured.');
    console.log('   Skipping Google Places search.\n');
    return [];
  }

  console.log(`🔍 Searching Google Places (max ${maxLocations} locations)...`);

  const allPlaces = new Map();

  for (const type of PRIORITY_TYPES) {
    try {
      console.log(`  Searching ${type}...`);

      const response = await client.placesNearby({
        params: {
          location: UPTOWN_CENTER,
          radius: RADIUS_METERS,
          type: type,
          key: apiKey,
        },
      });

      if (!response.data.results || response.data.results.length === 0) {
        console.log(`    No results for ${type}`);
        continue;
      }

      for (const place of response.data.results) {
        if (allPlaces.has(place.place_id)) continue;
        if (allPlaces.size >= maxLocations) break;

        allPlaces.set(place.place_id, {
          placeId: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address: place.vicinity,
          type: type,
          rating: place.rating || 0,
          photoReference: place.photos?.[0]?.photo_reference || null,
        });
      }

      console.log(`    Found ${response.data.results.length} locations`);

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 200));

      if (allPlaces.size >= maxLocations) {
        console.log(`  ⚠️  Reached limit of ${maxLocations} locations`);
        break;
      }
    } catch (error) {
      console.error(`  ✗ Error searching ${type}:`, error.message);
    }
  }

  console.log(`\n📊 Found ${allPlaces.size} unique locations from Google Places`);
  return Array.from(allPlaces.values());
}

/**
 * Add Google Places results to Firestore
 */
async function addPlacesToFirestore(places) {
  if (places.length === 0) return 0;

  console.log('\n💾 Adding Google Places locations to Firestore...');

  let totalAdded = 0;
  let skipped = 0;
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  for (const place of places) {
    const exists = await checkIfLocationExists(place.name);

    if (exists) {
      skipped++;
      continue;
    }

    const restroomRef = doc(collection(db, 'restrooms'));

    try {
      await setDoc(restroomRef, {
        id: restroomRef.id,
        name: place.name,
        latitude: place.lat,
        longitude: place.lng,
        geohash: generateGeohash(place.lat, place.lng),
        address: place.address,
        city: 'Charlotte',
        neighborhood: 'Uptown',
        type: place.type,
        isPublic: true,
        amenities: inferAmenities(place.type),
        rating: 0,
        reviews: 0,
        cleanliness: 0,
        supplies: 0,
        accessibility: 0,
        waitTime: 0,
        imageUrl: place.photoReference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photoReference}&key=${apiKey}`
          : null,
        source: 'google_places',
        googlePlaceId: place.placeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      totalAdded++;
      console.log(`  ✓ Added: ${place.name}`);
    } catch (error) {
      console.error(`  ✗ Failed: ${place.name} - ${error.message}`);
    }
  }

  if (totalAdded > 0) {
    console.log(`✅ Added ${totalAdded} new locations from Google Places`);
  }

  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing locations`);
  }

  return totalAdded;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚽 Call of Doody - Uptown Charlotte Seeder\n');
  console.log('📍 Location: Uptown Charlotte (2 mile radius)');
  console.log('🎯 Target: 30 locations');
  console.log('🏆 Focus: Highest quality locations only');
  console.log(`📦 Firebase Project: ${firebaseConfig.projectId}\n`);
  console.log('═══════════════════════════════════════════\n');

  try {
    const existingCount = await getExistingCount();
    console.log(`📊 Current database: ${existingCount} locations\n`);

    if (existingCount >= 30) {
      console.log('✅ Database already has 30+ locations!');
      console.log('   Database is ready for testing.\n');
      process.exit(0);
    }

    // Step 1: Seed priority locations (15 hand-picked spots)
    const priorityAdded = await seedPriorityLocations();

    // Step 2: Fill remaining with Google Places
    const currentCount = await getExistingCount();
    const remainingSlots = 30 - currentCount;

    if (remainingSlots > 0) {
      console.log(`📋 Need ${remainingSlots} more locations to reach 30...\n`);
      const places = await seedFromGooglePlaces(remainingSlots);
      const googleAdded = await addPlacesToFirestore(places);

      const finalCount = await getExistingCount();

      console.log('\n═══════════════════════════════════════════');
      console.log('🎉 SEEDING COMPLETE!\n');
      console.log('📊 Final Statistics:');
      console.log(`   Total locations: ${finalCount}`);
      console.log(`   Hand-picked: ${priorityAdded}`);
      console.log(`   Google Places: ${googleAdded}`);
      console.log('   Coverage: Uptown Charlotte (2 mile radius)\n');
      console.log('✅ Ready for beta testing!');
      console.log('═══════════════════════════════════════════\n');
    } else {
      const finalCount = await getExistingCount();
      console.log(`✅ Target reached! Database has ${finalCount} locations.\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
