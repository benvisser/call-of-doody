import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@call_of_doody_favorites';

/**
 * Save a restroom to favorites
 * @param {string} restroomId - The ID of the restroom to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveFavorite = async (restroomId) => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(restroomId)) {
      favorites.push(restroomId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    return true;
  } catch (error) {
    console.error('[Favorites] Error saving favorite:', error);
    return false;
  }
};

/**
 * Remove a restroom from favorites
 * @param {string} restroomId - The ID of the restroom to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeFavorite = async (restroomId) => {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(id => id !== restroomId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[Favorites] Error removing favorite:', error);
    return false;
  }
};

/**
 * Get all favorite restroom IDs
 * @returns {Promise<string[]>} - Array of restroom IDs
 */
export const getFavorites = async () => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('[Favorites] Error getting favorites:', error);
    return [];
  }
};

/**
 * Check if a restroom is favorited
 * @param {string} restroomId - The ID of the restroom to check
 * @returns {Promise<boolean>} - Whether the restroom is favorited
 */
export const isFavorite = async (restroomId) => {
  const favorites = await getFavorites();
  return favorites.includes(restroomId);
};

/**
 * Toggle favorite status for a restroom
 * @param {string} restroomId - The ID of the restroom to toggle
 * @returns {Promise<boolean>} - New favorite status (true = favorited)
 */
export const toggleFavorite = async (restroomId) => {
  const favorited = await isFavorite(restroomId);
  if (favorited) {
    await removeFavorite(restroomId);
    return false;
  } else {
    await saveFavorite(restroomId);
    return true;
  }
};

/**
 * Get the count of favorites
 * @returns {Promise<number>} - Number of favorites
 */
export const getFavoritesCount = async () => {
  const favorites = await getFavorites();
  return favorites.length;
};

/**
 * Clear all favorites
 * @returns {Promise<boolean>} - Success status
 */
export const clearFavorites = async () => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error('[Favorites] Error clearing favorites:', error);
    return false;
  }
};
