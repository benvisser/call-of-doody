# Data Migration Guide

This guide explains how to migrate the mock restroom data to Firestore.

## Prerequisites

1. Firebase project created (see `docs/FIREBASE_SETUP.md`)
2. `.env` file configured with Firebase credentials
3. Dependencies installed (`npm install`)

## Option 1: Run Migration Script (Recommended)

The easiest way to migrate data:

```bash
node scripts/migrate.js
```

This script will:
- Read all 10 restrooms from mock data
- Upload each to Firestore "restrooms" collection
- Skip duplicates (won't re-upload existing data)
- Log success/failure for each upload

### Expected Output

```
🚀 Starting Firestore migration...

📦 Firebase Project: call-of-doody-xxxxx
📍 Restrooms to upload: 10

✅ Uploaded: York Public Library
✅ Uploaded: Starbucks - York
✅ Uploaded: McDonald's York
...

📊 Migration Summary:
   ✅ Uploaded: 10
   ⏭️  Skipped: 0
   📍 Total in Firestore: 10

✨ Migration complete!
```

## Option 2: In-App Migration

You can also trigger migration from within the app:

```javascript
// In any component or the console:
import { migrateRestroomsToFirestore } from './src/utils/migrateData';

// Run migration
migrateRestroomsToFirestore().then(result => {
  console.log('Migration result:', result);
});

// Force re-upload (even if data exists)
migrateRestroomsToFirestore(true);
```

## Verify Migration

### In Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. You should see a `restrooms` collection with 10 documents

### In the App

1. Start the app: `npx expo start --clear`
2. Open in Expo Go
3. The map should show all 10 restroom markers
4. Check console for: "Loaded 10 restrooms from Firestore"

## Troubleshooting

### "Firebase not configured" error

Update your `.env` file with Firebase credentials:
```env
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
...
```

### Migration runs but map shows mock data

1. Restart with cache clear: `npx expo start --clear`
2. Check console for error messages
3. Verify Firestore rules allow read access

### Duplicate prevention not working

The script uses restroom IDs (1-10) as document IDs. If you see duplicates:
1. Check Firestore for documents with IDs "1", "2", etc.
2. Delete and re-run migration if needed

## Database Structure

After migration, Firestore contains:

```
restrooms/
├── 1
│   ├── name: "York Public Library"
│   ├── latitude: 34.9943
│   ├── longitude: -81.2423
│   ├── rating: 4.5
│   ├── cleanliness: 5
│   ├── amenities: ["toilets", "accessible", ...]
│   ├── gender: "separate"
│   ├── reviews: 87
│   ├── address: "138 E Liberty St, York, SC 29745"
│   ├── isPrivate: false
│   ├── imageUrl: "https://..."
│   └── createdAt: <timestamp>
├── 2
│   └── ...
└── ... (10 total)
```

## Adding New Restrooms

After migration, you can add new restrooms:

### Via Firebase Console

1. Go to Firestore Database
2. Click "Add document" in restrooms collection
3. Fill in all required fields

### Via Code (future feature)

```javascript
// Coming soon: User-submitted locations
import { addRestroom } from './src/services/restroomService';

await addRestroom({
  name: 'New Location',
  latitude: 34.9900,
  longitude: -81.2400,
  // ... other fields
});
```
