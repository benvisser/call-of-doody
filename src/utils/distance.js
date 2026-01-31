// Distance utilities using Haversine formula

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Format distance for display
 * @param {number} miles - Distance in miles
 * @returns {string} Formatted distance string
 */
export function formatDistance(miles) {
  if (miles < 0.1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
}

/**
 * Add distance property to restrooms based on user location
 * @param {Array} restrooms - Array of restroom objects
 * @param {Object} userLocation - User's location with latitude and longitude
 * @returns {Array} Restrooms with distance property added
 */
export function addDistanceToRestrooms(restrooms, userLocation) {
  if (!userLocation) return restrooms;

  return restrooms.map(restroom => ({
    ...restroom,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      restroom.latitude,
      restroom.longitude
    ),
  }));
}

/**
 * Sort restrooms by distance
 * @param {Array} restrooms - Array of restrooms with distance property
 * @returns {Array} Sorted restrooms (closest first)
 */
export function sortByDistance(restrooms) {
  return [...restrooms].sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
