# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call of Doody is a React Native (Expo) mobile app for finding public restrooms with crowd-sourced ratings and reviews. Currently in MVP phase using mock data.

## Development Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (press w=web, i=iOS, a=Android)
npm run ios          # Start with iOS simulator
npm run android      # Start with Android emulator
npm run web          # Start in web browser
```

## Architecture

**Navigation**: Uses React Navigation (NOT Expo Router). All routes defined in App.js via `createNativeStackNavigator()`.

**Screen Flow**:
- MapScreen (initial) - Map with restroom markers, search bar, location services
- RestroomDetailScreen - Full restroom details (currently unused; MapScreen has integrated bottom sheet)

**Key Patterns**:
- Functional components with hooks only (no class components)
- MapScreen contains an animated bottom sheet for restroom details (using PanResponder)
- Location permissions handled via expo-location
- Mock data in `src/data/mockData.js` - will be replaced with Firebase

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

## Important Notes

- Uses Google Maps provider (`PROVIDER_GOOGLE`) - requires API key for production
- Custom map styling defined in `src/styles/mapStyle.js`
- MapScreen uses hardcoded city list for search (production should use Google Places API)
- Default location is York, SC (34.9943, -81.2423)