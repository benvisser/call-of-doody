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

## 3b. Enable Firebase Storage (Required for Image Uploads)

1. In the Firebase Console, go to "Build" > "Storage"
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select the same region as Firestore
5. Click "Done"

## 4. Configure Environment Variables

### For Local Development

Copy the Firebase config values to your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...
```

### For Production Builds (EAS/TestFlight)

**CRITICAL:** Environment variables must be set as EAS env vars for production builds!

**Option A: Push from .env file (Recommended)**
```bash
# Push all variables from your .env file to EAS
eas env:push --environment production
```

**Option B: Create individually**
```bash
# List current env vars
eas env:list

# Set each Firebase env var
eas env:create EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSy..." --environment production
eas env:create EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-project-id.firebaseapp.com" --environment production
eas env:create EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id" --environment production
eas env:create EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-project-id.appspot.com" --environment production
eas env:create EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789" --environment production
eas env:create EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123456789:web:abc123..." --environment production

# Also set Google Maps API key for iOS
eas env:create EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --value "AIzaSy..." --environment production
```

Verify all env vars are set:
```bash
eas env:list
```

You should see all 7 variables listed.

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

reviews (collection)
├── {documentId} (document)
│   ├── restroomId: string
│   ├── userId: string
│   ├── userName: string
│   ├── ratings: object
│   │   ├── cleanliness: number (1-5)
│   │   ├── supplies: number (1-5)
│   │   ├── accessibility: number (1-5)
│   │   └── waitTime: number (1-5)
│   ├── averageRating: number (calculated average of 4 ratings)
│   ├── reviewText: string (optional, max 500 chars)
│   ├── helpful: number
│   └── createdAt: timestamp
```

## Security Rules

### Firestore Rules

In Firebase Console > Firestore > Rules, set:

**For MVP/Testing (allows anonymous submissions and reviews):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrooms collection - public read, anonymous create, update for ratings
    match /restrooms/{restroomId} {
      allow read: if true;
      allow create: if request.resource.data.submittedAt is timestamp;
      // Allow updates only for rating/cleanliness/reviews fields (review averages)
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['rating', 'cleanliness', 'reviews']);
      allow delete: if false;
    }

    // Pending restrooms (if using moderation)
    match /pending_restrooms/{restroomId} {
      allow read: if true;
      allow create: if request.resource.data.submittedAt is timestamp;
      allow update, delete: if false;
    }

    // Reviews collection (4-category rating system)
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.resource.data.restroomId is string
                    && request.resource.data.averageRating >= 1
                    && request.resource.data.averageRating <= 5
                    && request.resource.data.ratings.cleanliness >= 1
                    && request.resource.data.ratings.cleanliness <= 5
                    && request.resource.data.ratings.supplies >= 1
                    && request.resource.data.ratings.supplies <= 5
                    && request.resource.data.ratings.accessibility >= 1
                    && request.resource.data.ratings.accessibility <= 5
                    && request.resource.data.ratings.waitTime >= 1
                    && request.resource.data.ratings.waitTime <= 5;
      allow delete: if true;  // Allow users to delete their own reviews
      allow update: if false;
    }
  }
}
```

**For Production (requires authentication):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restrooms/{restroomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }

    match /pending_restrooms/{restroomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }

    // Reviews collection (4-category rating system)
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.averageRating >= 1
                    && request.resource.data.averageRating <= 5
                    && request.resource.data.ratings.cleanliness >= 1
                    && request.resource.data.ratings.cleanliness <= 5
                    && request.resource.data.ratings.supplies >= 1
                    && request.resource.data.ratings.supplies <= 5
                    && request.resource.data.ratings.accessibility >= 1
                    && request.resource.data.ratings.accessibility <= 5
                    && request.resource.data.ratings.waitTime >= 1
                    && request.resource.data.ratings.waitTime <= 5;
      // Only allow delete if user owns the review
      allow delete: if request.auth != null
                    && resource.data.userId == request.auth.uid;
      allow update: if false;
    }
  }
}
```

### Storage Rules

In Firebase Console > Storage > Rules, set:

**For MVP/Testing (allows anonymous uploads with size limit):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /restroom-images/{imageId} {
      // Anyone can read images
      allow read: if true;

      // Allow uploads with size limit (5MB)
      allow write: if request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**For Production (requires authentication):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /restroom-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**IMPORTANT:** After updating rules, click "Publish" to apply them!

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

### Firestore Indexes

The reviews query requires a composite index. Firebase will auto-create this on first query, or you can create it manually:

1. Go to Firebase Console > Firestore > Indexes
2. Click "Add Index"
3. Collection: `reviews`
4. Fields:
   - `restroomId` (Ascending)
   - `createdAt` (Descending)
5. Query scope: Collection
6. Click "Create Index"

### TestFlight/Production Build Issues

**Submissions work in development but fail in TestFlight:**

1. **Check EAS env vars are set:**
   ```bash
   eas env:list
   ```
   All Firebase variables must be listed.

2. **Check Firebase Console logs:**
   - Go to Firebase Console > Firestore > Usage
   - Look for denied reads/writes
   - Check Rules Playground to test your rules

3. **Check Storage rules:**
   - Go to Firebase Console > Storage > Rules
   - Ensure `restroom-images` path allows writes
   - Test with Rules Playground

4. **View device logs:**
   - Connect device to Mac
   - Open Console.app
   - Filter by "CallOfDoody"
   - Look for `[Firebase]`, `[AddRestroom]`, `[ImageUpload]` prefixed logs

5. **Common error codes:**
   - `permission-denied`: Update Firestore/Storage rules
   - `storage/unauthorized`: Update Storage rules
   - `unavailable`: Network issue, check connection
   - `not-found`: Check project ID and bucket name

6. **Rebuild after adding secrets:**
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

### Image Upload Fails

1. **Check Storage is enabled** in Firebase Console
2. **Check Storage rules** allow writes to `restroom-images/`
3. **Check EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET** is set correctly
4. **Check file size** - images are limited to 5MB after compression

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
