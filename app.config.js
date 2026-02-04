// Dynamic Expo configuration
// This file replaces app.json to allow environment variable usage

export default {
  expo: {
    name: "CallOfDoody",
    slug: "CallOfDoody",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.benvisser.callofdoody",
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        usesNonExemptEncryption: false,
        // Google Maps API key for iOS (required for production builds)
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to find nearby restrooms.",
        NSPhotoLibraryUsageDescription: "Call of Doody needs access to your photo library to upload restroom photos.",
        NSCameraUsageDescription: "Call of Doody needs access to your camera to take restroom photos."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.benvisser.callofdoody",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        // Google Maps API key for Android (required for production builds)
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth"
    ],
    extra: {
      eas: {
        projectId: "aa7d7d6f-1b44-4df3-a6d3-accf44da9811"
      }
    }
  }
};
