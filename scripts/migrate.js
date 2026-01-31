#!/usr/bin/env node
/**
 * Standalone Migration Script for Node.js
 *
 * Usage: node scripts/migrate.js
 *
 * This script uploads all mock restroom data to Firestore.
 * Make sure you have a .env file with Firebase credentials.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, serverTimestamp } = require('firebase/firestore');
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

// Mock restroom data (copied from src/data/mockData.js)
const mockRestrooms = [
  {
    id: '1',
    name: 'York Public Library',
    latitude: 34.9943,
    longitude: -81.2423,
    rating: 4.5,
    cleanliness: 5,
    amenities: ['toilets', 'accessible', 'changing_table', 'sinks', 'hand_dryer'],
    gender: 'separate',
    reviews: 87,
    address: '138 E Liberty St, York, SC 29745',
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Starbucks - York',
    latitude: 35.0012,
    longitude: -81.2301,
    rating: 3.8,
    cleanliness: 3,
    amenities: ['toilets', 'sinks', 'paper_towels'],
    gender: 'unisex',
    reviews: 45,
    address: '1644 E Liberty St, York, SC 29745',
    isPrivate: true,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: "McDonald's York",
    latitude: 34.9989,
    longitude: -81.2278,
    rating: 3.5,
    cleanliness: 3,
    amenities: ['toilets', 'urinals', 'sinks', 'hand_dryer'],
    gender: 'separate',
    reviews: 123,
    address: '1782 E Liberty St, York, SC 29745',
    isPrivate: true,
    imageUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Walmart Supercenter York',
    latitude: 34.9956,
    longitude: -81.2156,
    rating: 4.0,
    cleanliness: 4,
    amenities: ['toilets', 'urinals', 'accessible', 'changing_table', 'family', 'sinks'],
    gender: 'separate',
    reviews: 234,
    address: '2106 E Liberty St, York, SC 29745',
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'York County Government Center',
    latitude: 34.9951,
    longitude: -81.2451,
    rating: 4.3,
    cleanliness: 5,
    amenities: ['toilets', 'urinals', 'accessible', 'sinks', 'hand_dryer'],
    gender: 'separate',
    reviews: 67,
    address: '6 S Congress St, York, SC 29745',
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Olive Garden York',
    latitude: 35.0023,
    longitude: -81.2189,
    rating: 4.2,
    cleanliness: 4,
    amenities: ['toilets', 'accessible', 'sinks', 'paper_towels'],
    gender: 'separate',
    reviews: 156,
    address: '2191 E Liberty St, York, SC 29745',
    isPrivate: true,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    name: 'CVS Pharmacy York',
    latitude: 34.9998,
    longitude: -81.2312,
    rating: 3.7,
    cleanliness: 3,
    amenities: ['toilets', 'sinks', 'hand_dryer'],
    gender: 'unisex',
    reviews: 34,
    address: '1589 E Liberty St, York, SC 29745',
    isPrivate: true,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    name: 'York Comprehensive High School',
    latitude: 34.9887,
    longitude: -81.2534,
    rating: 4.1,
    cleanliness: 4,
    amenities: ['toilets', 'urinals', 'accessible', 'sinks', 'hand_dryer'],
    gender: 'separate',
    reviews: 89,
    address: '301 E Liberty St, York, SC 29745',
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop',
  },
  {
    id: '9',
    name: 'Food Lion York',
    latitude: 34.9978,
    longitude: -81.2267,
    rating: 3.9,
    cleanliness: 4,
    amenities: ['toilets', 'accessible', 'sinks', 'paper_towels'],
    gender: 'separate',
    reviews: 78,
    address: '1820 E Liberty St, York, SC 29745',
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop',
  },
  {
    id: '10',
    name: 'Bojangles York',
    latitude: 35.0034,
    longitude: -81.2245,
    rating: 3.6,
    cleanliness: 3,
    amenities: ['toilets', 'sinks', 'hand_dryer'],
    gender: 'separate',
    reviews: 92,
    address: '2043 E Liberty St, York, SC 29745',
    isPrivate: true,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  },
];

async function migrate() {
  console.log('🚀 Starting Firestore migration...\n');
  console.log(`📦 Firebase Project: ${firebaseConfig.projectId}`);
  console.log(`📍 Restrooms to upload: ${mockRestrooms.length}\n`);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const restroomsRef = collection(db, 'restrooms');

  // Check if data already exists
  const existingDocs = await getDocs(restroomsRef);
  if (!existingDocs.empty) {
    console.log(`⚠️  Found ${existingDocs.size} existing restrooms in Firestore.`);
    console.log('   Skipping duplicates (matching by ID)...\n');
  }

  const existingIds = new Set(existingDocs.docs.map(doc => doc.id));
  let uploaded = 0;
  let skipped = 0;

  for (const restroom of mockRestrooms) {
    if (existingIds.has(restroom.id)) {
      console.log(`⏭️  Skipping: ${restroom.name} (already exists)`);
      skipped++;
      continue;
    }

    try {
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
        isPrivate: restroom.isPrivate,
        imageUrl: restroom.imageUrl,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Uploaded: ${restroom.name}`);
      uploaded++;
    } catch (error) {
      console.error(`❌ Failed: ${restroom.name} - ${error.message}`);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Uploaded: ${uploaded}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📍 Total in Firestore: ${existingDocs.size + uploaded}`);
  console.log('\n✨ Migration complete!');

  process.exit(0);
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
