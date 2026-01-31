import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing configuration
const missingVars = [];
if (!firebaseConfig.apiKey) missingVars.push('EXPO_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.projectId) missingVars.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingVars.push('EXPO_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.warn('Firebase config incomplete. Missing:', missingVars.join(', '));
  console.warn('Add these to your .env file. See docs/FIREBASE_SETUP.md');
}

// Check if using placeholder values
const isConfigured = firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id';

// Auto-approve submissions for MVP (set to false for moderation)
const AUTO_APPROVE_SUBMISSIONS = true;

// Initialize Firebase only if not already initialized
let app;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization failed:', error.message);
  // Create placeholder to prevent crashes
  db = null;
  storage = null;
}

export { db, storage, isConfigured, AUTO_APPROVE_SUBMISSIONS };
export default app;
