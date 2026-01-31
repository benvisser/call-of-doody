# Firebase Setup Guide

This guide walks you through setting up Firebase for the Call of Doody app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "call-of-doody")
4. Disable Google Analytics (optional, not needed for this app)
5. Click "Create project"

## 2. Add a Web App

1. In your Firebase project, click the gear icon > "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., "Call of Doody App")
5. Don't check "Firebase Hosting" (we're using Expo)
6. Click "Register app"
7. Copy the configuration values shown

## 3. Enable Firestore

1. In the Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
   - Note: Update security rules before production!
4. Select your preferred region (e.g., us-central1)
5. Click "Enable"

## 4. Configure Environment Variables

Copy the Firebase config values to your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...
```

## 5. Migrate Mock Data to Firestore

After configuring Firebase, run the migration to populate your database:

### Option A: Using the App (Recommended for Development)

Add a temporary button or use the console to run:

```javascript
import { migrateRestroomsToFirestore } from './src/utils/migrateData';

// Call this once
migrateRestroomsToFirestore();
```

### Option B: Using Expo Console

1. Start the app: `npx expo start`
2. Open the browser debugger (press `j` for JavaScript debugger)
3. In the console, import and run the migration

## 6. Verify Data in Firestore

1. Go to Firebase Console > Firestore Database
2. You should see a `restrooms` collection
3. Each document should contain restroom data with fields like:
   - name, latitude, longitude
   - rating, cleanliness
   - amenities (array)
   - address, imageUrl

## Database Structure

```
restrooms (collection)
├── {documentId} (document)
│   ├── id: string (matches document ID)
│   ├── name: string
│   ├── latitude: number
│   ├── longitude: number
│   ├── rating: number (0-5)
│   ├── cleanliness: number (1-5)
│   ├── amenities: array<string>
│   ├── gender: string ('male' | 'female' | 'unisex' | 'separate')
│   ├── reviews: number
│   ├── address: string
│   ├── isPrivate: boolean
│   ├── imageUrl: string
│   └── createdAt: timestamp
```

## Security Rules (Production)

Before launching to production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrooms collection
    match /restrooms/{restroomId} {
      // Anyone can read restrooms
      allow read: if true;

      // Only authenticated users can create/update
      allow create, update: if request.auth != null;

      // Only admins can delete (implement admin check)
      allow delete: if false;
    }
  }
}
```

## Troubleshooting

### "Firebase not configured" message
- Check that all EXPO_PUBLIC_FIREBASE_* variables are set in `.env`
- Restart Expo with `npx expo start --clear` to reload environment

### No data showing on map
- Check Firebase Console to verify data exists
- Check browser/device console for errors
- Verify Firestore rules allow read access

### Network errors
- The app falls back to cached/mock data automatically
- Check your internet connection
- Verify Firebase project is active (not deleted/disabled)

## Useful Commands

```bash
# Clear Expo cache and restart
npx expo start --clear

# View Expo logs
npx expo start --dev-client
```

## Next Steps

After setup is complete:
1. Test that restrooms appear on the map
2. Verify real-time updates work (add a document in Firebase Console)
3. Update security rules for production
4. Consider adding Firebase Authentication for user features
