import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { customMapStyle } from '../styles/mapStyle';
import { addRestroom, isAutoApproveEnabled } from '../services/restroomService';
import { uploadRestroomImage, generateRestroomId } from '../utils/imageUpload';
import { searchPlaces, getPlaceDetails } from '../services/placesService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Gender facility options
const GENDER_OPTIONS = [
  { key: 'mens', icon: '🚹', label: "Men's Room" },
  { key: 'womens', icon: '🚺', label: "Women's Room" },
  { key: 'unisex', icon: '🚻', label: 'Gender Neutral' },
  { key: 'family', icon: '👨‍👩‍👧', label: 'Family Room' },
];

// Amenity options
const AMENITY_OPTIONS = [
  { key: 'accessible', icon: '♿️', label: 'Accessible' },
  { key: 'changing_table', icon: '👶', label: 'Changing Table' },
  { key: 'paper_towels', icon: '🧻', label: 'Paper Towels' },
  { key: 'hand_dryer', icon: '💨', label: 'Hand Dryer' },
  { key: 'soap', icon: '🧼', label: 'Soap Dispenser' },
  { key: 'toilets', icon: '🚽', label: 'Multiple Stalls' },
];

// Cleanliness labels
const CLEANLINESS_LABELS = [
  'Disaster Zone 🤢',
  'Needs Work 😬',
  'Decent 😐',
  'Clean 😊',
  'Spotless ✨',
];

export default function AddRestroomScreen({ visible, onClose, initialLocation, onSuccess }) {
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [genderFacilities, setGenderFacilities] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [cleanliness, setCleanliness] = useState(3);
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchDebounceRef = useRef(null);
  const miniMapRef = useRef(null);

  // Initialize location from props
  useEffect(() => {
    if (visible && initialLocation) {
      setLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
    }
  }, [visible, initialLocation]);

  // Animate modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetForm();
      onClose();
    });
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setIsPrivate(false);
    setGenderFacilities([]);
    setAmenities([]);
    setCleanliness(3);
    setImageUri(null);
    setLocation(null);
    setErrors({});
    setShowAddressSearch(false);
    setAddressSearchQuery('');
    setAddressResults([]);
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need your location to pin this restroom. Please enable location access in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get address
      try {
        const [reverseGeocode] = await Location.reverseGeocodeAsync(coords);
        if (reverseGeocode) {
          const parts = [
            reverseGeocode.streetNumber,
            reverseGeocode.street,
            reverseGeocode.city,
            reverseGeocode.region,
          ].filter(Boolean);
          setAddress(parts.join(' '));
        }
      } catch (geoError) {
        console.log('Reverse geocode failed:', geoError);
      }

      setErrors((prev) => ({ ...prev, location: null }));
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    }
  };

  const searchAddress = (text) => {
    setAddressSearchQuery(text);

    if (text.length < 3) {
      setAddressResults([]);
      setAddressSearchLoading(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setAddressSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setAddressResults(results);
      setAddressSearchLoading(false);
    }, 300);
  };

  const selectAddress = async (place) => {
    setShowAddressSearch(false);
    setAddress(place.mainText + (place.secondaryText ? ', ' + place.secondaryText : ''));

    if (place.placeId) {
      const coords = await getPlaceDetails(place.placeId);
      if (coords) {
        setLocation({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        setErrors((prev) => ({ ...prev, location: null }));
      }
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload restroom photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to access photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera access to take restroom photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Unable to access camera.');
    }
  };

  const toggleGenderFacility = (key) => {
    setGenderFacilities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setErrors((prev) => ({ ...prev, genderFacilities: null }));
  };

  const toggleAmenity = (key) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!location) {
      newErrors.location = "Hold up! We need the address before we can pin it";
    }
    if (!name.trim()) {
      newErrors.name = 'Please enter a name for this location';
    }
    if (genderFacilities.length === 0) {
      newErrors.genderFacilities = 'Please select at least one facility type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Oops! We need a few more details", "Please fill in the required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique ID for this restroom
      const restroomId = generateRestroomId();

      // Upload image if provided (gracefully handle failures)
      let imageUrl = null;
      if (imageUri) {
        console.log('[AddRestroom] Uploading image...');
        try {
          imageUrl = await uploadRestroomImage(imageUri, restroomId);
          if (!imageUrl) {
            console.log('[AddRestroom] Image upload returned null, continuing without image');
          }
        } catch (uploadError) {
          console.warn('[AddRestroom] Image upload failed, continuing without image:', uploadError.message);
          // Continue without image - don't block submission
        }
      }

      // Prepare restroom data
      const restroomData = {
        name: name.trim(),
        address: address || 'Address not provided',
        latitude: location.latitude,
        longitude: location.longitude,
        isPrivate,
        gender: genderFacilities.includes('unisex') ? 'unisex' :
                (genderFacilities.includes('mens') && genderFacilities.includes('womens')) ? 'separate' :
                genderFacilities[0] || 'unisex',
        amenities: [
          ...amenities,
          ...(genderFacilities.includes('accessible') ? ['accessible'] : []),
          ...(genderFacilities.includes('family') ? ['family'] : []),
        ],
        cleanliness,
        rating: cleanliness, // Initial rating based on cleanliness
        reviews: 0,
        imageUrl,
      };

      console.log('[AddRestroom] Submitting restroom:', restroomData.name);
      const result = await addRestroom(restroomData);

      if (result.success) {
        const autoApproved = result.autoApproved;

        // Show success message
        Alert.alert(
          autoApproved ? "Your throne is now on the map! 🎉" : "Thanks for dropping a pin! 💩",
          autoApproved
            ? "Fellow travelers can now find this restroom."
            : "We'll review it faster than you can say 'courtesy flush'",
          [{ text: 'Awesome!', onPress: closeWithAnimation }]
        );

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.error || 'Failed to add restroom');
      }
    } catch (error) {
      console.error('[AddRestroom] Submit error:', error);
      Alert.alert(
        "Uh oh! Something got clogged",
        "Please try again in a moment.",
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation} statusBarTranslucent>
      <View style={styles.backdrop} pointerEvents="box-none">
        <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={closeWithAnimation} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={closeWithAnimation} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Add a Throne 💩</Text>
                <Text style={styles.headerSubtitle}>Help fellow travelers find relief</Text>
              </View>
              <View style={styles.closeButton} />
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Location Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Where's the porcelain?</Text>

                {location ? (
                  <View style={styles.miniMapContainer}>
                    <MapView
                      ref={miniMapRef}
                      style={styles.miniMap}
                      provider={PROVIDER_GOOGLE}
                      customMapStyle={customMapStyle}
                      initialRegion={{
                        ...location,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                    >
                      <Marker coordinate={location}>
                        <View style={styles.miniMarker}>
                          <Text style={styles.miniMarkerIcon}>🚽</Text>
                        </View>
                      </Marker>
                    </MapView>
                    {address ? (
                      <Text style={styles.addressText}>{address}</Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.locationButtons}>
                  <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation}>
                    <MaterialIcons name="my-location" size={20} color="#5D4037" />
                    <Text style={styles.locationButtonText}>Use my current location</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() => setShowAddressSearch(true)}
                  >
                    <MaterialIcons name="search" size={20} color="#5D4037" />
                    <Text style={styles.locationButtonText}>Search for address</Text>
                  </TouchableOpacity>
                </View>

                {errors.location && (
                  <Text style={styles.errorText}>{errors.location}</Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Basic Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Info</Text>

                <Text style={styles.inputLabel}>Name / Business Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Joe's Coffee Shop"
                  placeholderTextColor="#999999"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setErrors((prev) => ({ ...prev, name: null }));
                  }}
                />
                <Text style={styles.inputHelper}>Where is this bathroom located?</Text>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <Text style={[styles.inputLabel, { marginTop: 20 }]}>Access Type *</Text>
                <View style={styles.accessPills}>
                  <TouchableOpacity
                    style={[styles.accessPill, !isPrivate && styles.accessPillSelected]}
                    onPress={() => setIsPrivate(false)}
                  >
                    <Text style={[styles.accessPillText, !isPrivate && styles.accessPillTextSelected]}>
                      Public
                    </Text>
                    <Text style={[styles.accessPillSubtext, !isPrivate && styles.accessPillSubtextSelected]}>
                      Everyone's invited! 🎉
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.accessPill, isPrivate && styles.accessPillSelected]}
                    onPress={() => setIsPrivate(true)}
                  >
                    <Text style={[styles.accessPillText, isPrivate && styles.accessPillTextSelected]}>
                      Private
                    </Text>
                    <Text style={[styles.accessPillSubtext, isPrivate && styles.accessPillSubtextSelected]}>
                      Customers only 🔐
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Facilities Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's in stock? *</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>

                <View style={styles.facilitiesGrid}>
                  {GENDER_OPTIONS.map((option) => {
                    const isSelected = genderFacilities.includes(option.key);
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[styles.facilityPill, isSelected && styles.facilityPillSelected]}
                        onPress={() => toggleGenderFacility(option.key)}
                      >
                        <Text style={styles.facilityIcon}>{option.icon}</Text>
                        <Text style={[styles.facilityLabel, isSelected && styles.facilityLabelSelected]}>
                          {option.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.genderFacilities && (
                  <Text style={styles.errorText}>{errors.genderFacilities}</Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Amenities Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>The good stuff</Text>
                <Text style={styles.sectionSubtitle}>What amenities are available?</Text>

                <View style={styles.amenitiesGrid}>
                  {AMENITY_OPTIONS.map((option) => {
                    const isSelected = amenities.includes(option.key);
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[styles.amenityPill, isSelected && styles.amenityPillSelected]}
                        onPress={() => toggleAmenity(option.key)}
                      >
                        <Text style={styles.amenityIcon}>{option.icon}</Text>
                        <Text style={[styles.amenityLabel, isSelected && styles.amenityLabelSelected]}>
                          {option.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Photo Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Show us the goods</Text>
                <Text style={styles.sectionSubtitle}>A picture is worth a thousand flushes</Text>

                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage}>
                    <MaterialIcons name="add-photo-alternate" size={48} color="#CCCCCC" />
                    <Text style={styles.imageUploadText}>Tap to add a photo</Text>
                    <Text style={styles.imageUploadHint}>
                      No pic? No problem! But a photo helps others know what they're getting into
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <MaterialIcons name="photo-library" size={20} color="#5D4037" />
                    <Text style={styles.photoButtonText}>Choose from Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <MaterialIcons name="camera-alt" size={20} color="#5D4037" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Cleanliness Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>First impressions? *</Text>
                <Text style={styles.sectionSubtitle}>How clean was it when you visited?</Text>

                <View style={styles.cleanlinessContainer}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setCleanliness(star)}
                        style={styles.starButton}
                      >
                        <Text style={[styles.star, star <= cleanliness && styles.starFilled]}>
                          ★
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.cleanlinessLabel}>
                    {CLEANLINESS_LABELS[cleanliness - 1]}
                  </Text>
                </View>
              </View>

              <View style={{ height: 140 }} />
            </ScrollView>

            {/* Bottom Submit Bar */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.submitButtonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Deploying coordinates...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Add Throne to Map 🚽</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* Address Search Modal */}
      <Modal visible={showAddressSearch} transparent animationType="slide">
        <View style={styles.addressSearchModal}>
          <View style={styles.addressSearchHeader}>
            <TouchableOpacity onPress={() => setShowAddressSearch(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.addressSearchTitle}>Search Address</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.addressSearchInputContainer}>
            <MaterialIcons name="search" size={22} color="#717171" />
            <TextInput
              style={styles.addressSearchInput}
              placeholder="Enter address..."
              placeholderTextColor="#999999"
              value={addressSearchQuery}
              onChangeText={searchAddress}
              autoFocus
            />
          </View>

          {addressSearchLoading ? (
            <View style={styles.addressSearchLoading}>
              <ActivityIndicator size="small" color="#717171" />
            </View>
          ) : (
            <ScrollView style={styles.addressResultsContainer}>
              {addressResults.map((result, index) => (
                <TouchableOpacity
                  key={result.placeId || index}
                  style={styles.addressResultItem}
                  onPress={() => selectAddress(result)}
                >
                  <MaterialIcons name="place" size={20} color="#717171" />
                  <View style={styles.addressResultText}>
                    <Text style={styles.addressResultMain}>{result.mainText}</Text>
                    {result.secondaryText && (
                      <Text style={styles.addressResultSecondary}>{result.secondaryText}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#222222',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#717171',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 24,
  },
  // Location styles
  miniMapContainer: {
    marginBottom: 16,
  },
  miniMap: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniMarker: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5D4037',
  },
  miniMarkerIcon: {
    fontSize: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#717171',
    marginTop: 8,
  },
  locationButtons: {
    gap: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  locationButtonText: {
    fontSize: 15,
    color: '#222222',
    marginLeft: 10,
  },
  // Input styles
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF385C',
  },
  inputHelper: {
    fontSize: 13,
    color: '#717171',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF385C',
    marginTop: 8,
  },
  // Access type styles
  accessPills: {
    flexDirection: 'row',
    gap: 12,
  },
  accessPill: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  accessPillSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  accessPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  accessPillTextSelected: {
    color: '#5D4037',
  },
  accessPillSubtext: {
    fontSize: 12,
    color: '#717171',
    marginTop: 4,
  },
  accessPillSubtextSelected: {
    color: '#8B7355',
  },
  // Facilities styles
  facilitiesGrid: {
    gap: 12,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  facilityPillSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  facilityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  facilityLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },
  facilityLabelSelected: {
    fontWeight: '500',
  },
  // Amenities styles
  amenitiesGrid: {
    gap: 12,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  amenityPillSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  amenityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  amenityLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },
  amenityLabelSelected: {
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5D4037',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Photo styles
  imageUploadArea: {
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#717171',
    marginTop: 12,
  },
  imageUploadHint: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#5D4037',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Cleanliness styles
  cleanlinessContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
    color: '#DDDDDD',
  },
  starFilled: {
    color: '#FFB400',
  },
  cleanlinessLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#717171',
    marginTop: 12,
  },
  // Bottom bar styles
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  submitButton: {
    backgroundColor: '#8B7355',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  // Address search modal styles
  addressSearchModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addressSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  addressSearchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  addressSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  addressSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222222',
    marginLeft: 10,
  },
  addressSearchLoading: {
    padding: 20,
    alignItems: 'center',
  },
  addressResultsContainer: {
    flex: 1,
  },
  addressResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  addressResultText: {
    flex: 1,
    marginLeft: 12,
  },
  addressResultMain: {
    fontSize: 15,
    color: '#222222',
  },
  addressResultSecondary: {
    fontSize: 13,
    color: '#717171',
    marginTop: 2,
  },
});
