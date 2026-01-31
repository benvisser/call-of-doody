# Upgrade to Expo SDK 54

This document describes the upgrade from Expo SDK 52 to SDK 54.

## Why Upgrade?

The Expo Go app on iOS/Android requires SDK 54. Projects on SDK 52 will show compatibility errors.

## Changes Made

### package.json Updates

| Package | Old Version | New Version |
|---------|-------------|-------------|
| expo | ~52.0.0 | ~54.0.0 |
| react | 18.3.1 | 19.1.0 |
| react-native | 0.76.5 | 0.81.5 |
| expo-location | ~18.0.4 | ~19.0.8 |
| expo-status-bar | ~2.0.0 | ~3.0.9 |
| react-native-safe-area-context | 4.12.0 | ~5.6.0 |
| react-native-screens | ~4.4.0 | ~4.16.0 |
| react-native-maps | 1.18.0 | ~1.20.1 |
| @react-navigation/native | ^6.1.9 | ^7.0.0 |
| @react-navigation/native-stack | ^6.9.17 | ^7.0.0 |

## After Claude Code Makes Changes

Run these commands to complete the upgrade:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall all packages
npm install

# Clear Expo cache and start
npx expo start --clear
```

## One-Line Command

```bash
rm -rf node_modules package-lock.json && npm install && npx expo start --clear
```

## React 19 Compatibility

SDK 54 uses React 19. Our codebase is fully compatible:
- All components use functional syntax with hooks
- No deprecated lifecycle methods
- No string refs or legacy context

Hooks used (all compatible with React 19):
- `useState`, `useEffect`, `useRef` - work identically

## Breaking Changes to Watch

### React Navigation 7

React Navigation 7 has some API changes from v6:
- Most existing code should work without changes
- If you see navigation errors, check the [migration guide](https://reactnavigation.org/docs/7.x/upgrading-from-6.x)

### expo-location

Updated to v19. API remains the same for our usage.

### react-native-maps

Updated to 1.20.1. No breaking changes for our usage.

## Troubleshooting

### "SDK version mismatch" error
- Make sure you ran `npx expo start --clear`
- Update Expo Go app to latest version from App Store/Play Store

### Metro bundler errors
```bash
npx expo start --clear
```

### Dependency resolution errors
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "Unable to resolve module" errors
```bash
watchman watch-del-all
npx expo start --clear
```

## Verification

After upgrade, verify:
1. App loads in Expo Go without SDK mismatch error
2. Map displays correctly with markers
3. Search bar works (Google Places API)
4. Restroom detail sheet opens
5. Get Directions button works
