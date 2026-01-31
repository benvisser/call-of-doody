import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  TextInput,
  FlatList,
  Keyboard,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { customMapStyle } from '../styles/mapStyle';
import { searchPlaces, getPlaceDetails } from '../services/placesService';
import { subscribeToRestrooms, getCachedRestrooms } from '../services/restroomService';
import FilterModal, { AMENITY_OPTIONS, CLEANLINESS_OPTIONS, DISTANCE_OPTIONS } from '../components/FilterModal';
import { formatDistance, addDistanceToRestrooms } from '../utils/distance';

const DEFAULT_FILTERS = {
  accessType: 'all',
  amenities: [],
  cleanliness: 'any',
  distance: 'any',
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DETAIL_SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function MapScreen() {
  const [location, setLocation] = useState({
    latitude: 34.9943,
    longitude: -81.2423,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRestroom, setSelectedRestroom] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [restrooms, setRestrooms] = useState([]);
  const [dataError, setDataError] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  const mapRef = useRef(null);
  const detailPanY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const searchDebounceRef = useRef(null);

  const detailPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => setScrollEnabled(false),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) detailPanY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        setScrollEnabled(true);
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeDetail();
        } else {
          Animated.spring(detailPanY, {
            toValue: 0,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const openDetail = (restroom) => {
    setSelectedRestroom(restroom);
    setShowDetail(true);
    detailPanY.setValue(SCREEN_HEIGHT);
    Animated.spring(detailPanY, {
      toValue: 0,
      useNativeDriver: false,
      tension: 50,
      friction: 9,
    }).start();
  };

  const closeDetail = () => {
    Animated.timing(detailPanY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowDetail(false);
      setSelectedRestroom(null);
    });
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Subscribe to restrooms from Firestore (or mock data as fallback)
  useEffect(() => {
    const unsubscribe = subscribeToRestrooms(
      (data) => {
        setRestrooms(data);
        setDataError(null);
      },
      (error) => {
        console.error('Error loading restrooms:', error);
        setDataError('Unable to load restrooms. Using cached data.');
        setRestrooms(getCachedRestrooms());
      }
    );

    return () => unsubscribe();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setLocation(coords);
        setUserLocation(coords);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const goToCurrentLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const searchLocation = (text) => {
    setSearchQuery(text);

    if (text.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      return;
    }

    // Debounce API calls
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
      setSearchLoading(false);
    }, 300);
  };

  const selectCity = async (place) => {
    setShowSearchResults(false);
    setSearchQuery(place.name);
    Keyboard.dismiss();

    let coords = place.coordinates;

    // If using Google Places API (has placeId), fetch coordinates
    if (place.placeId && !coords) {
      setSearchLoading(true);
      coords = await getPlaceDetails(place.placeId);
      setSearchLoading(false);
    }

    if (coords) {
      const newLocation = {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setLocation(newLocation);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newLocation, 1000);
      }
    }
  };

  // Filter and add distance to restrooms
  const filteredRestrooms = useMemo(() => {
    // First add distance to all restrooms
    let result = addDistanceToRestrooms(restrooms, userLocation);

    // Apply access type filter
    if (filters.accessType === 'public') {
      result = result.filter((r) => !r.isPrivate);
    } else if (filters.accessType === 'private') {
      result = result.filter((r) => r.isPrivate);
    }

    // Apply amenities filter
    if (filters.amenities.length > 0) {
      result = result.filter((r) =>
        filters.amenities.every((amenity) => r.amenities.includes(amenity))
      );
    }

    // Apply cleanliness filter
    const cleanlinessOption = CLEANLINESS_OPTIONS.find((o) => o.key === filters.cleanliness);
    if (cleanlinessOption && cleanlinessOption.min > 0) {
      result = result.filter((r) => r.cleanliness >= cleanlinessOption.min);
    }

    // Apply distance filter
    if (userLocation && filters.distance !== 'any') {
      const distanceOption = DISTANCE_OPTIONS.find((o) => o.key === filters.distance);
      if (distanceOption && distanceOption.max !== Infinity) {
        result = result.filter((r) => r.distance <= distanceOption.max);
      }
    }

    return result;
  }, [restrooms, userLocation, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.accessType !== 'all' ||
      filters.amenities.length > 0 ||
      filters.cleanliness !== 'any' ||
      filters.distance !== 'any'
    );
  }, [filters]);

  // Get active filter labels for chips
  const getActiveFilterChips = useCallback(() => {
    const chips = [];

    if (filters.accessType === 'public') {
      chips.push({ key: 'accessType', label: 'Public Only' });
    } else if (filters.accessType === 'private') {
      chips.push({ key: 'accessType', label: 'Private Only' });
    }

    filters.amenities.forEach((amenityKey) => {
      const amenity = AMENITY_OPTIONS.find((a) => a.key === amenityKey);
      if (amenity) {
        chips.push({ key: `amenity-${amenityKey}`, amenityKey, label: amenity.label });
      }
    });

    if (filters.cleanliness !== 'any') {
      const option = CLEANLINESS_OPTIONS.find((o) => o.key === filters.cleanliness);
      chips.push({ key: 'cleanliness', label: `${option?.label} stars` });
    }

    if (filters.distance !== 'any') {
      const option = DISTANCE_OPTIONS.find((o) => o.key === filters.distance);
      chips.push({ key: 'distance', label: option?.label });
    }

    return chips;
  }, [filters]);

  const removeFilter = useCallback((chip) => {
    if (chip.key === 'accessType') {
      setFilters((prev) => ({ ...prev, accessType: 'all' }));
    } else if (chip.key.startsWith('amenity-')) {
      setFilters((prev) => ({
        ...prev,
        amenities: prev.amenities.filter((a) => a !== chip.amenityKey),
      }));
    } else if (chip.key === 'cleanliness') {
      setFilters((prev) => ({ ...prev, cleanliness: 'any' }));
    } else if (chip.key === 'distance') {
      setFilters((prev) => ({ ...prev, distance: 'any' }));
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const openDirections = async (restroom) => {
    const { latitude, longitude, name } = restroom;
    const encodedName = encodeURIComponent(name);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong opening directions');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push(<Text key={i} style={styles.starFilled}>★</Text>);
      else if (i === fullStars && hasHalf) stars.push(<Text key={i} style={styles.starHalf}>★</Text>);
      else stars.push(<Text key={i} style={styles.starEmpty}>★</Text>);
    }
    return stars;
  };

  const amenityInfo = {
    toilets: { icon: '🚽', label: 'Toilets' },
    urinals: { icon: '🧍', label: 'Urinals' },
    accessible: { icon: '♿️', label: 'Accessible' },
    changing_table: { icon: '👶', label: 'Changing Table' },
    family: { icon: '👨‍👩‍👧', label: 'Family Room' },
    sinks: { icon: '💧', label: 'Sinks' },
    paper_towels: { icon: '🧻', label: 'Paper Towels' },
    hand_dryer: { icon: '💨', label: 'Hand Dryer' },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF385C" />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mapError ? (
        <View style={styles.mapErrorContainer}>
          <Text style={styles.mapErrorIcon}>🗺️</Text>
          <Text style={styles.mapErrorTitle}>Map failed to load</Text>
          <Text style={styles.mapErrorText}>{mapError}</Text>
          <Text style={styles.mapErrorHint}>
            Check that Google Maps API key is configured correctly for iOS.
          </Text>
        </View>
      ) : null}
      <MapView
        ref={mapRef}
        style={[styles.map, mapError && { display: 'none' }]}
        provider={PROVIDER_GOOGLE}
        customMapStyle={customMapStyle}
        initialRegion={location}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onMapReady={() => {
          setMapReady(true);
          console.log('[MapScreen] Map loaded successfully');
        }}
        onError={(error) => {
          console.error('[MapScreen] Map error:', error);
          setMapError(error?.nativeEvent?.error || 'Unknown map error');
        }}
      >
        {filteredRestrooms.map((restroom) => (
          <Marker
            key={restroom.id}
            coordinate={{
              latitude: restroom.latitude,
              longitude: restroom.longitude,
            }}
            onPress={() => openDetail(restroom)}
            tracksViewChanges={false}
          >
            <View style={[
              styles.marker,
              selectedRestroom?.id === restroom.id && styles.markerSelected
            ]}>
              <View style={styles.markerInner}>
                <Text style={styles.markerIcon}>🚽</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search Bar and Filter Button */}
      <View style={styles.searchContainer} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={22} color="#717171" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city..."
              value={searchQuery}
              onChangeText={searchLocation}
              onFocus={() => setShowSearchResults(searchResults.length > 0)}
              placeholderTextColor="#717171"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="tune" size={24} color="#5D4037" />
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterChipsContainer}
            contentContainerStyle={styles.filterChipsContent}
          >
            {getActiveFilterChips().map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={styles.filterChip}
                onPress={() => removeFilter(chip)}
              >
                <Text style={styles.filterChipText}>{chip.label}</Text>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Search Results Dropdown */}
        {(showSearchResults || searchLoading) && (
          <View style={styles.searchResults}>
            {searchLoading && searchResults.length === 0 ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color="#717171" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item.placeId || index.toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => selectCity(item)}
                  >
                    <Text style={styles.locationIcon}>📍</Text>
                    <View style={styles.searchResultTextContainer}>
                      <Text style={styles.searchResultText}>{item.mainText}</Text>
                      {item.secondaryText ? (
                        <Text style={styles.searchResultSecondary}>{item.secondaryText}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>

      {/* Error Banner */}
      {dataError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{dataError}</Text>
          <TouchableOpacity onPress={() => setDataError(null)}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Location Button */}
      {userLocation && (
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={goToCurrentLocation}
        >
          <Text style={styles.currentLocationIcon}>📍</Text>
        </TouchableOpacity>
      )}

      {/* No Results Message */}
      {filteredRestrooms.length === 0 && restrooms.length > 0 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No restrooms match your filters</Text>
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersButtonText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {showDetail && selectedRestroom && (
        <Animated.View 
          style={[
            styles.detailSheet,
            { transform: [{ translateY: detailPanY }] }
          ]}
        >
          <View style={styles.detailHandleContainer} {...detailPanResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.detailScroll}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            bounces={true}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedRestroom.imageUrl || 'https://via.placeholder.com/400x300/F5F5F5/999?text=No+Image' }}
                style={styles.detailImage}
              />
            </View>

            <View style={styles.detailContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedRestroom.name}</Text>
                <View style={styles.detailRatingRow}>
                  <View style={styles.starsContainer}>
                    {renderStars(selectedRestroom.rating)}
                    <Text style={styles.ratingNumber}>{selectedRestroom.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.reviewCount}>({selectedRestroom.reviews} reviews)</Text>
                </View>
                <Text style={styles.detailAddress}>{selectedRestroom.address}</Text>
                {selectedRestroom.distance !== undefined && (
                  <Text style={styles.detailDistance}>
                    {formatDistance(selectedRestroom.distance)} away
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Cleanliness</Text>
                  <Text style={styles.cleanlinessLabel}>
                    {selectedRestroom.cleanliness === 5 ? 'Spotless ✨' :
                     selectedRestroom.cleanliness === 4 ? 'Very Clean' :
                     selectedRestroom.cleanliness === 3 ? 'Clean' : 'Fair'}
                  </Text>
                </View>
                <View style={styles.cleanlinessBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.cleanlinessSegment,
                        level <= selectedRestroom.cleanliness && styles.cleanlinessActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What this place offers</Text>
                <View style={styles.amenitiesGrid}>
                  {selectedRestroom.amenities.map((amenity, index) => {
                    const info = amenityInfo[amenity] || { icon: '✓', label: amenity };
                    return (
                      <View key={index} style={styles.amenityItem}>
                        <Text style={styles.amenityIcon}>{info.icon}</Text>
                        <Text style={styles.amenityText}>{info.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent reviews</Text>
                
                <View style={styles.reviewItem}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
                    <View>
                      <Text style={styles.reviewerName}>Sarah</Text>
                      <Text style={styles.reviewDate}>December 2025</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStars}>{renderStars(5)}</View>
                  <Text style={styles.reviewText}>
                    Exceptionally clean! The changing table was a lifesaver.
                  </Text>
                </View>

                <View style={styles.reviewItem}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>
                    <View>
                      <Text style={styles.reviewerName}>James</Text>
                      <Text style={styles.reviewDate}>December 2025</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStars}>{renderStars(4)}</View>
                  <Text style={styles.reviewText}>Very good facilities. Easy to find.</Text>
                </View>

                <TouchableOpacity style={styles.showAllReviews}>
                  <Text style={styles.showAllText}>Show all {selectedRestroom.reviews} reviews</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 120 }} />
            </View>
          </ScrollView>

          <View style={styles.detailBottomBar}>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Free</Text>
              <Text style={styles.priceSubtext}>Public access</Text>
            </View>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections(selectedRestroom)}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredRestrooms.length}
        hasUserLocation={!!userLocation}
        onClearAll={clearAllFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#717171', fontWeight: '500' },
  mapErrorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 32 },
  mapErrorIcon: { fontSize: 48, marginBottom: 16 },
  mapErrorTitle: { fontSize: 20, fontWeight: '600', color: '#222222', marginBottom: 8 },
  mapErrorText: { fontSize: 14, color: '#717171', textAlign: 'center', marginBottom: 16 },
  mapErrorHint: { fontSize: 12, color: '#999999', textAlign: 'center', maxWidth: 280 },
  searchContainer: { position: 'absolute', top: 30, left: 16, right: 16, zIndex: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF385C',
  },
  filterChipsContainer: {
    marginTop: 10,
    marginHorizontal: -4,
  },
  filterChipsContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
    marginRight: 6,
  },
  filterChipClose: {
    fontSize: 12,
    color: '#717171',
  },
  noResultsContainer: {
    position: 'absolute',
    top: 140,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5,
  },
  noResultsText: {
    fontSize: 15,
    color: '#717171',
    marginBottom: 12,
    textAlign: 'center',
  },
  clearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
    textDecorationLine: 'underline',
  },
  searchIcon: { marginRight: 12 },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#222222',
    fontWeight: '500',
    padding: 0,
  },
  clearButton: { padding: 4 },
  clearButtonText: { fontSize: 18, color: '#717171' },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  locationIcon: { fontSize: 16, marginRight: 12 },
  searchResultTextContainer: { flex: 1 },
  searchResultText: { fontSize: 16, color: '#222222' },
  searchResultSecondary: { fontSize: 14, color: '#717171', marginTop: 2 },
  searchLoadingContainer: { padding: 20, alignItems: 'center' },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 9,
  },
  errorText: { flex: 1, color: '#991B1B', fontSize: 14 },
  errorDismiss: { color: '#991B1B', fontSize: 18, paddingLeft: 12 },
  currentLocationButton: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  currentLocationIcon: { fontSize: 24 },
  marker: { alignItems: 'center' },
  markerSelected: { transform: [{ scale: 1.2 }] },
  markerInner: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 24, borderWidth: 2, borderColor: '#5D4037', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  markerIcon: { fontSize: 20 },
  detailSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: DETAIL_SHEET_HEIGHT, backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20, zIndex: 15 },
  detailHandleContainer: { paddingTop: 8, paddingBottom: 8, alignItems: 'center', zIndex: 10 },
  handle: { width: 32, height: 4, backgroundColor: '#DDDDDD', borderRadius: 2 },
  detailScroll: { flex: 1 },
  imageContainer: { paddingTop: 20, paddingHorizontal: 20 },
  detailImage: { width: '100%', height: 260, backgroundColor: '#F5F5F5', borderRadius: 20 },
  detailContent: { flex: 1 },
  detailHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  detailTitle: { fontSize: 26, fontWeight: '600', color: '#222222', marginBottom: 8, letterSpacing: -0.5 },
  detailRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  starsContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  starFilled: { fontSize: 14, color: '#FF385C', marginRight: 1 },
  starHalf: { fontSize: 14, color: '#FF385C', marginRight: 1 },
  starEmpty: { fontSize: 14, color: '#DDDDDD', marginRight: 1 },
  ratingNumber: { fontSize: 14, fontWeight: '600', color: '#222222', marginLeft: 6 },
  reviewCount: { fontSize: 14, color: '#717171' },
  detailAddress: { fontSize: 15, color: '#717171', lineHeight: 20 },
  detailDistance: { fontSize: 14, color: '#5D4037', fontWeight: '500', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#EBEBEB', marginHorizontal: 24, marginVertical: 24 },
  section: { paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: '#222222', marginBottom: 16 },
  cleanlinessLabel: { fontSize: 14, fontWeight: '600', color: '#008489' },
  cleanlinessBar: { flexDirection: 'row', gap: 4, height: 6 },
  cleanlinessSegment: { flex: 1, backgroundColor: '#EBEBEB', borderRadius: 3 },
  cleanlinessActive: { backgroundColor: '#008489' },
  amenitiesGrid: { gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  amenityIcon: { fontSize: 20, width: 32 },
  amenityText: { fontSize: 16, color: '#222222', marginLeft: 8 },
  reviewItem: { marginBottom: 32 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222222', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  reviewerName: { fontSize: 16, fontWeight: '600', color: '#222222', marginBottom: 2 },
  reviewDate: { fontSize: 14, color: '#717171' },
  reviewStars: { flexDirection: 'row', marginBottom: 12 },
  reviewText: { fontSize: 15, lineHeight: 24, color: '#222222' },
  showAllReviews: { marginTop: 8, paddingVertical: 16, borderWidth: 1, borderColor: '#222222', borderRadius: 8, alignItems: 'center' },
  showAllText: { fontSize: 16, fontWeight: '600', color: '#222222' },
  detailBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEB', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  priceSection: { flex: 1 },
  priceLabel: { fontSize: 16, fontWeight: '600', color: '#222222' },
  priceSubtext: { fontSize: 14, color: '#717171' },
  directionsButton: { backgroundColor: '#FF385C', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  directionsButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});