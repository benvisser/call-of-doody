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
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to max 1200px width
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Convert local URI to blob for upload
 * @param {string} uri - Local image URI
 * @returns {Promise<Blob>} Image blob
 */
const uriToBlob = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

/**
 * Upload an image to Firebase Storage
 * @param {string} localUri - Local image URI from image picker
 * @param {string} restroomId - ID to use for the image filename
 * @returns {Promise<string|null>} Download URL or null on failure
 */
export const uploadRestroomImage = async (localUri, restroomId) => {
  if (!isConfigured || !storage) {
    console.warn('Firebase Storage not configured');
    return null;
  }

  try {
    // Compress image first
    const compressedUri = await compressImage(localUri);

    // Convert to blob
    const blob = await uriToBlob(compressedUri);

    // Create filename with timestamp
    const timestamp = Date.now();
    const filename = `restroom-images/${timestamp}_${restroomId}.jpg`;

    // Create storage reference
    const storageRef = ref(storage, filename);

    // Upload blob
    console.log('[ImageUpload] Uploading image...');
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[ImageUpload] Upload complete:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error('[ImageUpload] Upload failed:', error);
    return null;
  }
};

/**
 * Generate a unique ID for a restroom
 * @returns {string} Unique ID
 */
export const generateRestroomId = () => {
  return `restroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
