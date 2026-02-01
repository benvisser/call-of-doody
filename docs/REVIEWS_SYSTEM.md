# Reviews System

This guide documents the reviews system in Call of Doody, including user reviews, the badge/achievement system, and photo uploads.

## Overview

The reviews system allows users to:
- Rate restrooms across 4 categories
- Write optional text reviews
- Upload up to 3 photos per review
- View their review history in the "Reviews" tab
- Earn achievement badges for contributions

## Data Model

### Review Document Structure

Reviews are stored in the `reviews` Firestore collection:

```javascript
{
  id: string,                    // Auto-generated document ID
  restroomId: string,            // Links to restroom being reviewed
  restroomName: string,          // Cached restroom name for display
  userId: string,                // User identifier
  userName: string,              // Display name
  ratings: {
    cleanliness: number,         // 1-5 scale
    supplies: number,            // 1-5 scale
    accessibility: number,       // 1-5 scale
    waitTime: number,            // 1-5 scale
  },
  averageRating: number,         // Calculated average of 4 ratings
  reviewText: string,            // Optional, max 500 chars
  photos: string[],              // Array of Firebase Storage URLs
  helpful: number,               // Helpful vote count
  createdAt: timestamp,          // Firestore timestamp
}
```

### Rating Categories

| Category | Description | Scale Labels |
|----------|-------------|--------------|
| Cleanliness | How clean was it? | Scary (1) to Spotless (5) |
| Supplies | Toilet paper, soap, etc. | Empty (1) to Fully Stocked (5) |
| Accessibility | Easy access, spacious? | Limited (1) to Very Accessible (5) |
| Wait Time | How long did you wait? | Forever (1) to No Wait (5) |

## Components

### WriteReviewScreen

Full-screen modal for submitting reviews.

**Location:** `src/screens/WriteReviewScreen.js`

**Features:**
- Slide-in animation from left
- 4-category rating selector with emoji labels
- Photo upload (up to 3 photos)
- Optional text review (500 char limit)
- Keyboard-aware scrolling
- Unsaved changes warning on close

**Props:**
```javascript
{
  visible: boolean,       // Show/hide modal
  onClose: () => void,    // Close handler
  restroom: object,       // Restroom being reviewed
  onReviewSubmitted: () => void,  // Success callback
}
```

### ReviewsScreen

Tab screen showing user's review history and badges.

**Location:** `src/screens/ReviewsScreen.js`

**Features:**
- List of user's reviews with cards
- Achievement badges strip
- Sort by: Newest, Highest Rated, A-Z
- Pull-to-refresh
- Delete review functionality
- Empty state with call-to-action

## Badge System

Users earn badges for various achievements. Badges encourage engagement and reward consistent contributions.

### Badge Definitions

| Badge | Title | Requirement | Icon |
|-------|-------|-------------|------|
| first_review | First Drop | Post 1 review | Target |
| five_reviews | Getting Regular | Post 5 reviews | Star |
| ten_reviews | Throne Expert | Post 10 reviews | Trophy |
| pioneer | Porcelain Pioneer | First to review a restroom | Flag |
| photographer | Picture Perfect | Add photo to review | Camera |
| detailed | Quality Inspector | Fill all rating categories | Search |
| honest | Stink Spotter | Give honest low ratings | Alert |
| helpful | Community Helper | Reviews marked helpful | Heart |

### Badge Calculation

Badges are calculated client-side based on user's review data:

```javascript
const calculateBadges = (reviews) => {
  const earned = [];

  // Count-based badges
  if (reviews.length >= 1) earned.push('first_review');
  if (reviews.length >= 5) earned.push('five_reviews');
  if (reviews.length >= 10) earned.push('ten_reviews');

  // Content-based badges
  if (reviews.some(r => r.photos?.length > 0)) earned.push('photographer');
  if (reviews.some(r => hasAllRatings(r.ratings))) earned.push('detailed');
  if (reviews.some(r => r.averageRating <= 2)) earned.push('honest');

  return earned;
};
```

## Photo Uploads

### Storage Structure

Photos are stored in Firebase Storage under:
```
reviews/{restroomId}/{timestamp}_{index}.jpg
```

### Upload Process

1. User selects photo from library or takes new photo
2. Photo is compressed to 80% quality, max 1920px dimension
3. Converted to blob for upload
4. Uploaded to Firebase Storage with retry logic
5. Download URL stored in review document

### Image Upload Functions

**Location:** `src/utils/imageUpload.js`

```javascript
// Upload single review photo
uploadReviewPhoto(uri, restroomId, index) -> Promise<string>

// Upload multiple photos with progress
uploadMultipleReviewPhotos(photos, restroomId, onProgress) -> Promise<string[]>
```

### Storage Rules

Add to your Firebase Storage rules:

```javascript
match /reviews/{restroomId}/{imageId} {
  allow read: if true;
  allow write: if request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

## Sorting & Filtering

The Reviews screen supports sorting by:

| Key | Label | Sort Logic |
|-----|-------|------------|
| date | Newest | createdAt descending |
| rating | Highest Rated | averageRating descending |
| name | A-Z | restroomName alphabetically |

## Firestore Queries

### Fetch User Reviews

```javascript
const reviewsRef = collection(db, 'reviews');
const q = query(
  reviewsRef,
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);
const snapshot = await getDocs(q);
```

### Required Index

Create a composite index for the reviews query:

1. Go to Firebase Console > Firestore > Indexes
2. Add Index:
   - Collection: `reviews`
   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

## Review Helpers

**Location:** `src/utils/reviewHelpers.js`

Utility functions for working with reviews:

```javascript
// Rating category definitions
RATING_CATEGORIES = [
  { key: 'cleanliness', title: 'Cleanliness', ... },
  { key: 'supplies', title: 'Supplies', ... },
  ...
]

// Get human-readable label for rating value
getCategoryLabel(category, value) -> string

// Calculate average from all 4 ratings
calculateAverageFromRatings(ratings) -> number

// Check if all ratings are filled
hasAllRatings(ratings) -> boolean

// Count filled rating categories
countFilledRatings(ratings) -> number
```

## Star Rating Display

Star ratings use MaterialIcons for consistent display across the app:

```javascript
const renderStars = (rating, showRating = false) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<MaterialIcons name="star" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<MaterialIcons name="star-half" />);
    } else {
      stars.push(<MaterialIcons name="star-border" />);
    }
  }

  return (
    <View style={styles.starsRow}>
      {stars}
      {showRating && <Text>{rating.toFixed(1)}</Text>}
    </View>
  );
};
```

## User Identification

Currently, users are identified by a device-generated ID stored in AsyncStorage. For production:

1. Implement Firebase Authentication
2. Replace `userId` with authenticated user ID
3. Add user profile management
4. Enable review editing/deletion with ownership checks

## Troubleshooting

### Reviews not showing

1. Check Firebase Console for data in `reviews` collection
2. Verify `userId` matches between submission and query
3. Check Firestore rules allow reads
4. Look for index creation prompts in console logs

### Photo upload fails

1. Verify Firebase Storage is enabled
2. Check Storage rules allow writes to `reviews/` path
3. Check `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` is set
4. Check console for specific error messages

### Badges not updating

Badges are calculated on each screen load. If badges seem stuck:
1. Pull-to-refresh the Reviews screen
2. Check that reviews are being saved correctly
3. Verify badge calculation logic matches your requirements

### Missing restroom names

Reviews created before the `restroomName` field was added will show "Unknown Location". The ReviewsScreen attempts to fetch names from the restrooms collection as a fallback.

## Future Enhancements

- [ ] Review editing
- [ ] Helpful vote system
- [ ] Photo gallery lightbox
- [ ] Badge notifications
- [ ] Review moderation/reporting
- [ ] Verified reviews (after authentication)
