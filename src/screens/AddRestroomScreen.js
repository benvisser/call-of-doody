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
import { checkFirebaseStatus } from '../config/firebase';
import { searchPlaces, getPlaceDetails } from '../services/placesService';
import { Colors } from '../constants/colors';
import { AmenityTagSelector } from '../components/AmenityTagSelector';
import { initializeRestroomAmenities } from '../utils/amenityVoting';
import {
  RATING_CATEGORIES,
  getCategoryLabel,
  calculateAverageFromRatings,
  hasAllRatings,
  countFilledRatings,
} from '../utils/reviewHelpers';
import { BATHROOM_TYPES } from '../constants/bathroomTypes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


export default function AddRestroomScreen({ visible, onClose, initialLocation, onSuccess }) {
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [bathroomTypes, setBathroomTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    supplies: 0,
    accessibility: 0,
    waitTime: 0,
  });
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(''); // Track progress for user feedback
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
    setBathroomTypes([]);
    setAmenities([]);
    setRatings({
      cleanliness: 0,
      supplies: 0,
      accessibility: 0,
      waitTime: 0,
    });
    setImageUri(null);
    setLocation(null);
    setErrors({});
    setShowAddressSearch(false);
    setAddressSearchQuery('');
    setAddressResults([]);
  };

  // Set a rating for a specific category
  const setRating = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
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

  const toggleBathroomType = (typeId) => {
    setBathroomTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
    setErrors((prev) => ({ ...prev, bathroomTypes: null }));
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
    if (bathroomTypes.length === 0) {
      newErrors.bathroomTypes = 'Please select at least one bathroom type';
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
    setSubmissionStep('Checking connection...');

    try {
      // Step 1: Check Firebase status before attempting submission
      console.log('[AddRestroom] ===== STARTING SUBMISSION =====');
      console.log('[AddRestroom] Form data:', {
        name: name.trim(),
        address: address || 'not provided',
        location: location,
        amenities: amenities,
        bathroomTypes: bathroomTypes,
        hasImage: !!imageUri,
      });

      const firebaseStatus = checkFirebaseStatus();
      console.log('[AddRestroom] Firebase status:', firebaseStatus);

      if (!firebaseStatus.initialized) {
        console.error('[AddRestroom] Firebase not ready:', firebaseStatus.error);
        Alert.alert(
          "Connection Issue",
          `Unable to connect to server.\n\nError: ${firebaseStatus.error}\n\nPlease check your internet connection and try again.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 2: Generate unique ID
      setSubmissionStep('Preparing submission...');
      const restroomId = generateRestroomId();
      console.log('[AddRestroom] Generated ID:', restroomId);

      // Step 3: Upload image if provided (gracefully handle failures)
      let imageUrl = null;
      if (imageUri) {
        setSubmissionStep('Uploading photo...');
        console.log('[AddRestroom] Step 3: Uploading image...');
        try {
          imageUrl = await uploadRestroomImage(imageUri, restroomId);
          console.log('[AddRestroom] Image upload result:', imageUrl ? 'success' : 'returned null');
          if (!imageUrl) {
            console.log('[AddRestroom] Image upload returned null, continuing without image');
          }
        } catch (uploadError) {
          console.warn('[AddRestroom] Image upload failed:', uploadError.message);
          console.warn('[AddRestroom] Continuing without image');
          // Continue without image - don't block submission
        }
      } else {
        console.log('[AddRestroom] No image to upload');
      }

      // Step 4: Prepare and validate restroom data
      setSubmissionStep('Saving location...');
      console.log('[AddRestroom] Step 4: Preparing restroom data...');

      // Validate coordinates are numbers
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinates: lat=${location.latitude}, lng=${location.longitude}`);
      }

      // Initialize amenities with submitter's vote
      const amenitiesData = initializeRestroomAmenities(amenities);

      // Calculate average rating from 4 categories
      const averageRating = calculateAverageFromRatings(ratings);

      const restroomData = {
        name: name.trim(),
        address: address || 'Address not provided',
        latitude: lat,
        longitude: lng,
        isPrivate,
        bathroomTypes: bathroomTypes, // New bathroom types array
        // Legacy gender field for backwards compatibility
        gender: bathroomTypes.includes('all_gender') ? 'unisex' :
                (bathroomTypes.includes('mens') && bathroomTypes.includes('womens')) ? 'separate' :
                bathroomTypes[0] || 'unisex',
        ...amenitiesData, // adds amenities object and confirmedAmenities array
        ratings, // Store all 4 category ratings
        cleanliness: ratings.cleanliness, // Keep for backwards compatibility
        rating: averageRating, // Overall rating is average of 4 categories
        reviews: 0,
        imageUrl,
      };

      console.log('[AddRestroom] Restroom data prepared:', JSON.stringify(restroomData, null, 2));

      // Step 5: Submit to Firestore
      console.log('[AddRestroom] Step 5: Submitting to Firestore...');
      const result = await addRestroom(restroomData);
      console.log('[AddRestroom] Submission result:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('[AddRestroom] ===== SUBMISSION SUCCESS =====');
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
        console.error('[AddRestroom] Submission failed:', result.error);
        throw new Error(result.error || 'Failed to add restroom');
      }
    } catch (error) {
      console.error('[AddRestroom] ===== SUBMISSION ERROR =====');
      console.error('[AddRestroom] Error name:', error.name);
      console.error('[AddRestroom] Error message:', error.message);
      console.error('[AddRestroom] Error code:', error.code);
      console.error('[AddRestroom] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Provide user-friendly error message with details for debugging
      let userMessage = error.message || 'An unexpected error occurred';

      // Add helpful context for common errors
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        userMessage = 'Permission denied. The app may need to be updated.';
      } else if (error.message?.includes('network') || error.message?.includes('Network') || error.code === 'unavailable') {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('Firebase not configured')) {
        userMessage = 'Server connection error. Please try again later.';
      }

      Alert.alert(
        "Submission Failed",
        `${userMessage}\n\nIf this persists, please screenshot this error and report it:\n\nCode: ${error.code || 'unknown'}\nDetails: ${error.message || 'none'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionStep('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
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
                      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                      customMapStyle={Platform.OS === 'android' ? customMapStyle : undefined}
                      mapType={Platform.OS === 'ios' ? 'mutedStandard' : undefined}
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

              {/* Bathroom Types Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bathroom Types *</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>

                <View style={styles.tagGrid}>
                  {BATHROOM_TYPES.map((type) => {
                    const isSelected = bathroomTypes.includes(type.id);
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.tag, isSelected && styles.tagSelected]}
                        onPress={() => toggleBathroomType(type.id)}
                      >
                        <Text style={styles.tagEmoji}>{type.emoji}</Text>
                        <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.bathroomTypes && (
                  <Text style={styles.errorText}>{errors.bathroomTypes}</Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Amenities Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <Text style={styles.sectionSubtitle}>What does this restroom have?</Text>

                <AmenityTagSelector
                  selectedAmenities={amenities}
                  onToggle={toggleAmenity}
                  showCount={8}
                />
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

              {/* Rating Categories Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rate your experience</Text>
                <Text style={styles.sectionSubtitle}>
                  {countFilledRatings(ratings)} of 4 rated
                </Text>

                {RATING_CATEGORIES.map((category) => {
                  const value = ratings[category.key];
                  const label = getCategoryLabel(category.key, value);

                  return (
                    <View key={category.key} style={styles.ratingCategory}>
                      <View style={styles.ratingHeader}>
                        <Text style={styles.ratingIcon}>{category.icon}</Text>
                        <Text style={styles.ratingTitle}>{category.title}</Text>
                        {value > 0 && <Text style={styles.ratingCheckmark}>✓</Text>}
                      </View>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setRating(category.key, star)}
                            style={styles.starButton}
                          >
                            <Text style={[styles.star, star <= value && styles.starFilled]}>
                              ★
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {value > 0 && (
                        <Text style={styles.ratingLabel}>{label}</Text>
                      )}
                      {category.helperText && (
                        <Text style={styles.ratingHelperText}>{category.helperText}</Text>
                      )}
                    </View>
                  );
                })}
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
                    <Text style={styles.submitButtonText}>{submissionStep || 'Submitting...'}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Add Throne to Map 🚽</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>

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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85,
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
  // Tag styles (used for facilities and amenities)
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tagSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  tagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  tagTextSelected: {
    color: '#5D4037',
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
  // Rating category styles
  ratingCategory: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    flex: 1,
  },
  ratingCheckmark: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
    color: '#DDDDDD',
  },
  starFilled: {
    color: '#FFB400',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.coral,
    marginTop: 4,
  },
  ratingHelperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
    backgroundColor: Colors.coral,
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
