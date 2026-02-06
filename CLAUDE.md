# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call of Doody is a React Native (Expo SDK 54) mobile app for finding public restrooms with crowd-sourced ratings and reviews.

## Development Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (press w=web, i=iOS, a=Android)
npm run ios          # Start with iOS simulator
npm run android      # Start with Android emulator
npm run web          # Start in web browser
```

## Architecture

**Navigation**: Uses React Navigation v7 (NOT Expo Router). All routes defined in App.js via `createNativeStackNavigator()`.

**Screen Flow**:
- MapScreen (initial) - Map with restroom markers, search bar, location services
- RestroomDetailScreen - Full restroom details (currently unused; MapScreen has integrated bottom sheet)

**Key Patterns**:
- Functional components with hooks only (no class components)
- MapScreen contains an animated bottom sheet for restroom details (using PanResponder)
- Location permissions handled via expo-location
- Data from Firestore with automatic fallback to mock data

**Data Model** (Restroom object):
```javascript
{
  id, name, latitude, longitude,
  rating (0-5), cleanliness (1-5),
  amenities: ['toilets', 'urinals', 'accessible', 'changing_table', 'family', 'sinks', 'paper_towels', 'hand_dryer'],
  gender: 'unisex' | 'separate',
  reviews, address, isPrivate, imageUrl
}
```

## Firebase / Firestore

Restroom data is stored in Firestore with real-time sync. Falls back to mock data if Firebase is not configured or empty.

**Setup:** See `docs/FIREBASE_SETUP.md` for detailed instructions.

**Key files:**
- `src/config/firebase.js` - Firebase initialization
- `src/services/restroomService.js` - Firestore queries with real-time sync & caching
- `scripts/migrate.js` - Node.js script to upload mock data to Firestore

**Data migration:**
```bash
node scripts/migrate.js  # Upload mock data to Firestore
```

See `docs/DATA_MIGRATION.md` for detailed migration instructions.

## Google Places API

The search bar uses Google Places Autocomplete API with fallback to a hardcoded city list.

**Setup:**
1. Copy `.env.example` to `.env`
2. Add your Google Places API key to `.env`
3. Restart Expo with `npx expo start --clear`

**Service location:** `src/services/placesService.js`
- `searchPlaces(query)` - Autocomplete search (debounced, 3+ chars)
- `getPlaceDetails(placeId)` - Fetch coordinates from place_id
- Falls back to hardcoded cities if API unavailable

## Important Notes

- Uses Google Maps provider (`PROVIDER_GOOGLE`) on Android with custom styling; falls back to Apple Maps with `mutedStandard` map type on iOS (no native SDK config needed)
- Custom map styling defined in `src/styles/mapStyle.js`
- Default location is York, SC (34.9943, -81.2423)