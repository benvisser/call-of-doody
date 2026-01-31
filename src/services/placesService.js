// Google Places Autocomplete Service

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Fallback cities when API is unavailable
const FALLBACK_CITIES = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
  { name: 'York, SC', lat: 34.9943, lng: -81.2423 },
  { name: 'Rock Hill, SC', lat: 34.9249, lng: -81.0251 },
  { name: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Columbia, SC', lat: 34.0007, lng: -81.0348 },
  { name: 'Charleston, SC', lat: 32.7765, lng: -79.9311 },
];

/**
 * Check if Google Places API is configured
 */
export const isApiConfigured = () => {
  return !!GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your_api_key_here';
};

/**
 * Search for places using Google Places Autocomplete API
 * Falls back to local city list if API is not configured or fails
 */
export const searchPlaces = async (query) => {
  if (!query || query.length < 3) {
    return [];
  }

  // Use fallback if API key not configured
  if (!isApiConfigured()) {
    return searchFallbackCities(query);
  }

  try {
    const params = new URLSearchParams({
      input: query,
      types: '(cities)',
      key: GOOGLE_PLACES_API_KEY,
    });

    const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map((prediction) => ({
        placeId: prediction.place_id,
        name: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
      }));
    }

    if (data.status === 'ZERO_RESULTS') {
      return [];
    }

    // API error - fall back to local search
    console.warn('Places API error:', data.status, data.error_message);
    return searchFallbackCities(query);
  } catch (error) {
    console.warn('Places API request failed:', error);
    return searchFallbackCities(query);
  }
};

/**
 * Get place details (coordinates) from place_id
 */
export const getPlaceDetails = async (placeId) => {
  if (!isApiConfigured()) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry',
      key: GOOGLE_PLACES_API_KEY,
    });

    const response = await fetch(`${DETAILS_URL}?${params}`);
    const data = await response.json();

    if (data.status === 'OK' && data.result?.geometry?.location) {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      };
    }

    console.warn('Place Details API error:', data.status);
    return null;
  } catch (error) {
    console.warn('Place Details API request failed:', error);
    return null;
  }
};

/**
 * Search fallback cities list (used when API is unavailable)
 */
const searchFallbackCities = (query) => {
  const lowerQuery = query.toLowerCase();
  return FALLBACK_CITIES
    .filter((city) => city.name.toLowerCase().includes(lowerQuery))
    .map((city) => ({
      placeId: null,
      name: city.name,
      mainText: city.name.split(',')[0],
      secondaryText: city.name.split(',')[1]?.trim() || '',
      coordinates: { lat: city.lat, lng: city.lng },
    }));
};