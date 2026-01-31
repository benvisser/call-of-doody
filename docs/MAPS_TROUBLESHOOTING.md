# Google Maps Troubleshooting Guide

This guide helps resolve issues with Google Maps not working in TestFlight or production iOS builds.

## Common Issue: Map Works in Development but Not in TestFlight

This is the most common issue with react-native-maps in Expo projects. The map works in Expo Go but shows blank or crashes in production builds.

### Root Cause

Production iOS builds require a properly configured Google Maps API key with iOS-specific restrictions. The key must be:
1. Configured in `app.config.js` under `ios.config.googleMapsApiKey`
2. Created with "iOS apps" restriction in Google Cloud Console
3. Have the correct bundle identifier

## Setup Guide

### Step 1: Create iOS-Specific API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project (or create one)
3. Click **+ CREATE CREDENTIALS** > **API key**
4. Click on the new key to configure it
5. Under **Application restrictions**, select **iOS apps**
6. Click **ADD** and enter your bundle identifier: `com.benvisser.callofdoody`
7. Click **SAVE**

### Step 2: Enable Required APIs

In Google Cloud Console, go to **APIs & Services** > **Library** and enable:

- **Maps SDK for iOS** (required)
- **Places API** (for search functionality)
- **Geocoding API** (for address lookup)

### Step 3: Configure Environment Variables

Add the API key to your `.env` file:

```bash
# iOS Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=AIzaSy...your_key_here

# Android Maps API Key (create separately with Android restriction)
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSy...your_android_key
```

### Step 4: Verify app.config.js

Ensure `app.config.js` reads the environment variable:

```javascript
ios: {
  config: {
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
  }
}
```

### Step 5: Rebuild the App

```bash
# Clear cache and rebuild
eas build --platform ios --clear-cache
```

## Verification Checklist

- [ ] API key has "iOS apps" restriction (not "HTTP referrers" or "None")
- [ ] Bundle ID matches exactly: `com.benvisser.callofdoody`
- [ ] Maps SDK for iOS is enabled in Google Cloud Console
- [ ] API key is in `.env` file as `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`
- [ ] `app.config.js` references the environment variable
- [ ] App was rebuilt after configuration changes

## Common Errors and Solutions

### Error: "Google Maps SDK for iOS must be initialized"

**Cause:** API key is not being passed to the native iOS build.

**Solution:**
1. Verify `app.config.js` has the `googleMapsApiKey` under `ios.config`
2. Make sure environment variable is set
3. Rebuild the app with `eas build --platform ios`

### Error: "This API project is not authorized to use this API"

**Cause:** The Maps SDK for iOS is not enabled.

**Solution:**
1. Go to Google Cloud Console > APIs & Services > Library
2. Search for "Maps SDK for iOS"
3. Click Enable

### Error: "API key is invalid" or map is blank

**Cause:** API key restrictions don't match.

**Solution:**
1. Check API key restrictions in Google Cloud Console
2. Ensure "iOS apps" is selected
3. Verify bundle ID is exactly: `com.benvisser.callofdoody`
4. Create a new key if needed

### Map works in Simulator but not on Device

**Cause:** Sometimes simulator uses a different code path.

**Solution:**
1. Test on a physical device connected via Xcode
2. Check Xcode console for Google Maps errors
3. Verify the provisioning profile matches the bundle ID

## Testing in TestFlight

1. Build for internal testing:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

3. Wait for Apple processing (can take up to an hour)

4. Install from TestFlight app and test

## Debugging Tips

### Check Console Logs

The app logs map status to the console:
- `[MapScreen] Map loaded successfully` - Map initialized correctly
- `[MapScreen] Map error: ...` - Shows the specific error

### Verify API Key in Build

After building, you can verify the API key was included:

1. Download the `.ipa` from EAS
2. Unzip it (rename to `.zip`)
3. Check `Payload/CallOfDoody.app/GoogleService-Info.plist` or the app's Info.plist

## Android Setup

For Android, create a separate API key with "Android apps" restriction:

1. Create new API key in Google Cloud Console
2. Set restriction to "Android apps"
3. Add SHA-1 fingerprint and package name: `com.benvisser.callofdoody`
4. Enable "Maps SDK for Android"
5. Add to `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`

Get your SHA-1 fingerprint:
```bash
eas credentials --platform android
```

## Need More Help?

- [react-native-maps documentation](https://github.com/react-native-maps/react-native-maps)
- [Expo MapView docs](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Maps Platform documentation](https://developers.google.com/maps/documentation/ios-sdk/get-api-key)
