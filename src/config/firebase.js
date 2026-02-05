import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Log config status on initialization (helps debug production issues)
console.log('[Firebase] Config status:', {
  apiKey: firebaseConfig.apiKey ? 'present' : 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
  storageBucket: firebaseConfig.storageBucket || 'MISSING',
  appId: firebaseConfig.appId ? 'present' : 'MISSING',
});

// Check for missing configuration
const missingVars = [];
if (!firebaseConfig.apiKey) missingVars.push('EXPO_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.projectId) missingVars.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingVars.push('EXPO_PUBLIC_FIREBASE_APP_ID');
if (!firebaseConfig.storageBucket) missingVars.push('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');

if (missingVars.length > 0) {
  console.error('[Firebase] CONFIG MISSING:', missingVars.join(', '));
  console.error('[Firebase] Ensure EAS env vars are set: eas env:list');
  console.error('[Firebase] See docs/FIREBASE_SETUP.md');
}

// Check if using placeholder values
const isConfigured = firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id';

// Auto-approve submissions for MVP (set to false for moderation)
const AUTO_APPROVE_SUBMISSIONS = true;

// Initialize Firebase only if not already initialized
let app = null;
let db = null;
let storage = null;
let auth = null;
let initError = null;

try {
  if (getApps().length === 0) {
    console.log('[Firebase] Initializing new app...');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('[Firebase] Using existing app instance');
    app = getApps()[0];
  }
  db = getFirestore(app);
  storage = getStorage(app);
  // Initialize auth with React Native persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (authError) {
    // initializeAuth throws if called more than once (e.g., hot reload)
    // Fall back to getAuth which returns the existing instance
    if (authError.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw authError;
    }
  }
  console.log('[Firebase] Initialized successfully for project:', firebaseConfig.projectId);
} catch (error) {
  initError = error;
  console.error('[Firebase] INITIALIZATION FAILED:', error.message);
  console.error('[Firebase] Error code:', error.code);
  console.error('[Firebase] Full error:', JSON.stringify(error, null, 2));
}

/**
 * Check if Firebase is properly initialized
 * @returns {{ initialized: boolean, error: string|null }}
 */
export const checkFirebaseStatus = () => {
  if (initError) {
    return { initialized: false, error: `Init failed: ${initError.message}` };
  }
  if (!isConfigured) {
    return { initialized: false, error: 'Firebase not configured - check EAS env vars' };
  }
  if (!db) {
    return { initialized: false, error: 'Firestore not initialized' };
  }
  if (!storage) {
    return { initialized: false, error: 'Storage not initialized' };
  }
  return { initialized: true, error: null };
};

export { db, storage, auth, isConfigured, AUTO_APPROVE_SUBMISSIONS };
export default app;
