# Update Guide - v0.3.0 Airbnb-Style Redesign

## What's New

This version completely redesigns the app to match Airbnb's UI pattern with a draggable bottom sheet and card-based list view.

## Files Included

### New/Updated Files:
- `src/screens/MapScreen.js` - **COMPLETELY REWRITTEN** with bottom sheet
- `src/styles/mapStyle.js` - Custom Airbnb-inspired map styling
- `src/data/mockData.js` - Updated with image URLs

### Removed Files:
- `src/components/RestroomBottomSheet.js` - **DELETE THIS** (no longer used)
- Old modal pattern replaced with bottom sheet in MapScreen

## Installation Steps

1. **Extract the archive** into your CallOfDoody project
2. **Delete old component**: Remove `src/components/RestroomBottomSheet.js` if it exists
3. **Replace MapScreen**: The new MapScreen.js is completely different
4. **Create styles folder**: Make sure `src/styles/` folder exists with `mapStyle.js`
5. **Start app**: `npx expo start`

## Architecture Changes

### Before (v0.2.0):
```
Map → Tap Marker → Modal Popup
```

### Now (v0.3.0):
```
Map + Bottom Sheet (persistent)
├── Collapsed: Shows count + preview images
└── Expanded: Shows scrollable card list
```

## Key Features

✅ **Draggable Bottom Sheet**
- Swipe up to expand
- Swipe down to collapse
- Auto-snaps to min/max height

✅ **Two States**
- **Collapsed (180px)**: "Over X restrooms" + 3 preview images
- **Expanded (full screen)**: Scrollable list of restroom cards

✅ **Interactive Map**
- Always visible at top
- Custom Airbnb-style colors
- Tap markers to select

✅ **Restroom Cards**
- Hero image
- Title + rating
- Address
- Cleanliness + Public/Private badges

## Troubleshooting

### "Cannot find module RestroomBottomSheet"
**Solution**: Delete `src/components/RestroomBottomSheet.js` - it's no longer used

### Bottom sheet not dragging
**Solution**: Make sure you're swiping on the gray handle bar at the top

### Cards not showing
**Solution**: Swipe up on the bottom sheet to expand it

## Next Steps

Future updates will add:
- Navigation to full detail screen when tapping cards
- Filter/search functionality
- Add new restroom button
- User reviews and ratings

## Testing Checklist

- [ ] Map loads with your location
- [ ] Bottom sheet starts collapsed
- [ ] Swipe up expands to full list
- [ ] Cards display with images
- [ ] Tap markers to select
- [ ] Swipe down collapses sheet
- [ ] Preview images show in collapsed state

---

**Version**: 0.3.0  
**Date**: January 30, 2026  
**Architecture**: Airbnb-inspired bottom sheet pattern
