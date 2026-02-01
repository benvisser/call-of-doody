import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isConfigured } from '../config/firebase';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress an image before upload
 * @param {string} uri - Local image URI
 * @returns {Promise<string>} Compressed image URI
 */
const compressImage = async (uri) => {
  try {
    console.log('[ImageUpload] Compressing image...');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to max 1200px width
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    console.log('[ImageUpload] Compression complete');
    return result.uri;
  } catch (error) {
    console.error('[ImageUpload] Compression failed:', error.message);
    return uri; // Return original if compression fails
  }
};

/**
 * Convert local URI to blob for upload
 * @param {string} uri - Local image URI
 * @returns {Promise<Blob>} Image blob
 */
const uriToBlob = async (uri) => {
  console.log('[ImageUpload] Converting URI to blob...');
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  console.log('[ImageUpload] Blob created, size:', blob.size, 'bytes');
  return blob;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<*>} Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, operationName = 'operation') => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[ImageUpload] ${operationName} attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max 5s
        console.log(`[ImageUpload] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

/**
 * Upload an image to Firebase Storage with retry logic
 * @param {string} localUri - Local image URI from image picker
 * @param {string} restroomId - ID to use for the image filename
 * @returns {Promise<string|null>} Download URL or null on failure
 */
export const uploadRestroomImage = async (localUri, restroomId) => {
  console.log('[ImageUpload] Starting upload for restroom:', restroomId);
  console.log('[ImageUpload] Local URI:', localUri);
  console.log('[ImageUpload] Storage configured:', isConfigured);
  console.log('[ImageUpload] Storage instance:', storage ? 'present' : 'MISSING');

  if (!isConfigured) {
    console.error('[ImageUpload] Firebase not configured - run: eas env:list');
    throw new Error('Firebase Storage not configured. Please check EAS environment variables.');
  }

  if (!storage) {
    console.error('[ImageUpload] Storage instance is null');
    throw new Error('Firebase Storage failed to initialize. Please restart the app.');
  }

  try {
    // Step 1: Compress image
    console.log('[ImageUpload] Step 1/4: Compressing image...');
    const compressedUri = await compressImage(localUri);

    // Step 2: Convert to blob
    console.log('[ImageUpload] Step 2/4: Converting to blob...');
    const blob = await retryWithBackoff(
      () => uriToBlob(compressedUri),
      3,
      'blob conversion'
    );

    // Step 3: Upload to Firebase Storage with retry
    console.log('[ImageUpload] Step 3/4: Uploading to Firebase Storage...');
    const timestamp = Date.now();
    const filename = `restroom-images/${timestamp}_${restroomId}.jpg`;
    const storageRef = ref(storage, filename);

    await retryWithBackoff(
      async () => {
        console.log('[ImageUpload] Uploading', blob.size, 'bytes to:', filename);
        await uploadBytes(storageRef, blob);
      },
      3,
      'storage upload'
    );

    // Step 4: Get download URL
    console.log('[ImageUpload] Step 4/4: Getting download URL...');
    const downloadUrl = await retryWithBackoff(
      () => getDownloadURL(storageRef),
      3,
      'get download URL'
    );

    console.log('[ImageUpload] SUCCESS! URL:', downloadUrl);
    return downloadUrl;

  } catch (error) {
    console.error('[ImageUpload] UPLOAD FAILED');
    console.error('[ImageUpload] Error name:', error.name);
    console.error('[ImageUpload] Error code:', error.code || 'no code');
    console.error('[ImageUpload] Error message:', error.message);
    console.error('[ImageUpload] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Provide actionable error messages
    if (error.code === 'storage/unauthorized') {
      console.error('[ImageUpload] FIX: Update Firebase Storage rules to allow writes to restroom-images/');
      console.error('[ImageUpload] See docs/FIREBASE_SETUP.md for required rules');
      throw new Error('Permission denied. The app needs permission to upload images. Please contact support.');
    }
    if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please try again later.');
    }
    if (error.code === 'storage/invalid-url' || error.code === 'storage/invalid-argument') {
      console.error('[ImageUpload] FIX: Check EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET with: eas env:list');
      throw new Error('Storage configuration error. Please contact support.');
    }
    if (error.message?.includes('network') || error.message?.includes('Network')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    throw error;
  }
};

/**
 * Generate a unique ID for a restroom
 * @returns {string} Unique ID
 */
export const generateRestroomId = () => {
  return `restroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Upload a single review photo to Firebase Storage
 * @param {string} uri - Local image URI
 * @param {string} restroomId - ID of the restroom
 * @param {number} index - Photo index (0, 1, or 2)
 * @returns {Promise<string>} Download URL
 */
export const uploadReviewPhoto = async (uri, restroomId, index) => {
  console.log('[ImageUpload] Uploading review photo', index, 'for restroom:', restroomId);

  if (!isConfigured || !storage) {
    throw new Error('Firebase Storage not configured');
  }

  try {
    // Compress image
    const compressedUri = await compressImage(uri);

    // Convert to blob
    const blob = await retryWithBackoff(
      () => uriToBlob(compressedUri),
      3,
      'review photo blob conversion'
    );

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const filename = `reviews/${restroomId}/${timestamp}_${index}.jpg`;
    const storageRef = ref(storage, filename);

    await retryWithBackoff(
      async () => {
        console.log('[ImageUpload] Uploading review photo', blob.size, 'bytes to:', filename);
        await uploadBytes(storageRef, blob);
      },
      3,
      'review photo upload'
    );

    // Get download URL
    const downloadUrl = await retryWithBackoff(
      () => getDownloadURL(storageRef),
      3,
      'review photo URL'
    );

    console.log('[ImageUpload] Review photo uploaded:', downloadUrl);
    return downloadUrl;

  } catch (error) {
    console.error('[ImageUpload] Review photo upload failed:', error.message);
    throw error;
  }
};

/**
 * Upload multiple review photos
 * @param {Array<{uri: string}>} photos - Array of photo objects with uri
 * @param {string} restroomId - ID of the restroom
 * @param {Function} onProgress - Optional progress callback (index, total)
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadMultipleReviewPhotos = async (photos, restroomId, onProgress) => {
  console.log('[ImageUpload] Uploading', photos.length, 'review photos');

  const urls = [];

  for (let i = 0; i < photos.length; i++) {
    if (onProgress) {
      onProgress(i + 1, photos.length);
    }

    try {
      const url = await uploadReviewPhoto(photos[i].uri, restroomId, i);
      urls.push(url);
    } catch (error) {
      console.error('[ImageUpload] Failed to upload photo', i, ':', error.message);
      // Continue with other photos even if one fails
      // Could also throw here if you want all-or-nothing behavior
    }
  }

  console.log('[ImageUpload] Successfully uploaded', urls.length, 'of', photos.length, 'photos');
  return urls;
};
