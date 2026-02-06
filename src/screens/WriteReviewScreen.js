import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  InputAccessoryView,
  Button,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { submitReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { uploadMultipleReviewPhotos } from '../utils/imageUpload';
import {
  RATING_CATEGORIES,
  getCategoryLabel,
  calculateAverageFromRatings,
  hasAllRatings,
  countFilledRatings,
  recalculateRestroomRatings,
} from '../utils/reviewHelpers';
import { AmenityConfirmation } from '../components/AmenityTagSelector';
import { voteOnAmenity } from '../utils/amenityVoting';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_REVIEW_LENGTH = 500;
const INPUT_ACCESSORY_VIEW_ID = 'reviewTextInputAccessory';

export default function WriteReviewScreen({ visible, onClose, restroom, onSuccess }) {
  const { user, userProfile } = useAuth();

  // Form state - 4 category ratings
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    supplies: 0,
    accessibility: 0,
    waitTime: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [confirmedAmenities, setConfirmedAmenities] = useState([]);
  const [deniedAmenities, setDeniedAmenities] = useState([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [textInputFocused, setTextInputFocused] = useState(false);

  // Refs
  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Animations - slide from left
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track keyboard visibility
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Animate modal from left
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(-SCREEN_WIDTH);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const hasContent = countFilledRatings(ratings) > 0 || reviewText.trim().length > 0 || photos.length > 0;

  const handleClose = () => {
    Keyboard.dismiss();

    if (hasContent) {
      Alert.alert(
        "Discard review?",
        "You have unsaved changes. Are you sure you want to discard this review?",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: closeWithAnimation
          }
        ]
      );
    } else {
      closeWithAnimation();
    }
  };

  const closeWithAnimation = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
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
    setRatings({
      cleanliness: 0,
      supplies: 0,
      accessibility: 0,
      waitTime: 0,
    });
    setReviewText('');
    setPhotos([]);
    setConfirmedAmenities([]);
    setDeniedAmenities([]);
    setUploadProgress('');
  };

  const canSubmit = hasAllRatings(ratings) && !isSubmitting;
  const filledCount = countFilledRatings(ratings);

  // Photo functions
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'We need access to your photos to upload images.',
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
        setPhotos(prev => [...prev, { uri: result.assets[0].uri }]);
      }
    } catch (error) {
      console.error('[WriteReview] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'We need access to your camera to take photos.',
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
        setPhotos(prev => [...prev, { uri: result.assets[0].uri }]);
      }
    } catch (error) {
      console.error('[WriteReview] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      // Upload photos first if any
      let photoUrls = [];
      if (photos.length > 0) {
        setUploadProgress('Uploading photos...');
        try {
          photoUrls = await uploadMultipleReviewPhotos(
            photos,
            restroom.id,
            (current, total) => {
              setUploadProgress(`Uploading photo ${current}/${total}...`);
            }
          );
        } catch (uploadError) {
          console.error('[WriteReview] Photo upload error:', uploadError);
          // Continue without photos if upload fails
          Alert.alert(
            'Photo Upload Issue',
            'Photos could not be uploaded, but your review will still be posted.',
            [{ text: 'OK' }]
          );
        }
        setUploadProgress('');
      }

      const averageRating = calculateAverageFromRatings(ratings);

      const reviewData = {
        restroomId: restroom.id,
        restroomName: restroom.name,
        ratings,
        averageRating,
        reviewText: reviewText.trim(),
        photos: photoUrls,
        userId: user?.uid || 'anonymous',
        userName: userProfile?.displayName || 'Anonymous User',
      };

      console.log('[WriteReview] Submitting review:', reviewData);
      const result = await submitReview(reviewData);

      if (result.success) {
        console.log('[WriteReview] Review submitted successfully');

        // Recalculate restroom ratings from all reviews
        try {
          console.log('[WriteReview] Recalculating restroom ratings...');
          await recalculateRestroomRatings(restroom.id);
          console.log('[WriteReview] Restroom ratings updated');
        } catch (recalcError) {
          console.warn('[WriteReview] Ratings recalculation error:', recalcError);
          // Don't fail the review if recalculation fails
        }

        // Submit amenity votes if user confirmed/denied any
        const hasAmenityVotes = confirmedAmenities.length > 0 || deniedAmenities.length > 0;
        if (hasAmenityVotes && user?.uid) {
          try {
            console.log('[WriteReview] Submitting amenity votes...');
            const votePromises = [
              ...confirmedAmenities.map(id => voteOnAmenity(restroom.id, id, user.uid, 'confirm')),
              ...deniedAmenities.map(id => voteOnAmenity(restroom.id, id, user.uid, 'deny')),
            ];
            await Promise.allSettled(votePromises);
            console.log('[WriteReview] Amenity votes submitted');
          } catch (voteError) {
            console.warn('[WriteReview] Amenity vote error:', voteError);
            // Don't fail the review if amenity votes fail
          }
        }

        Alert.alert(
          "Review posted! 💩",
          "Thanks for sharing your throne experience!",
          [{ text: 'Awesome!', onPress: () => {
            resetForm();
            if (onSuccess) {
              onSuccess(result);
            }
          }}]
        );
      } else {
        throw new Error(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('[WriteReview] Error:', error);
      Alert.alert(
        "Oops!",
        error.message || "Something went wrong. Please try again.",
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleTextInputFocus = () => {
    setTextInputFocused(true);
    // Scroll to show text input above keyboard
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleTextInputBlur = () => {
    setTextInputFocused(false);
  };

  const setRating = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  // Amenity confirmation handlers
  const handleConfirmAmenity = (amenityId) => {
    // Toggle off if already confirmed, otherwise set to confirmed
    if (confirmedAmenities.includes(amenityId)) {
      setConfirmedAmenities(prev => prev.filter(id => id !== amenityId));
    } else {
      setConfirmedAmenities(prev => [...prev, amenityId]);
      // Remove from denied if it was there
      setDeniedAmenities(prev => prev.filter(id => id !== amenityId));
    }
  };

  const handleDenyAmenity = (amenityId) => {
    // Toggle off if already denied, otherwise set to denied
    if (deniedAmenities.includes(amenityId)) {
      setDeniedAmenities(prev => prev.filter(id => id !== amenityId));
    } else {
      setDeniedAmenities(prev => [...prev, amenityId]);
      // Remove from confirmed if it was there
      setConfirmedAmenities(prev => prev.filter(id => id !== amenityId));
    }
  };

  const renderStars = (category, value) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(category, star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.star,
              star <= value ? styles.starFilled : styles.starEmpty
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRatingSection = (category) => {
    const value = ratings[category.key];
    const label = getCategoryLabel(category.key, value);
    const isComplete = value > 0;

    return (
      <View key={category.key} style={styles.ratingSection}>
        <View style={styles.ratingHeader}>
          <Text style={styles.ratingIcon}>{category.icon}</Text>
          <Text style={styles.ratingTitle}>{category.title}</Text>
          {isComplete && <Text style={styles.checkmark}>✓</Text>}
        </View>
        {renderStars(category.key, value)}
        {value > 0 && (
          <Text style={styles.ratingLabel}>{label}</Text>
        )}
        {category.helperText && (
          <Text style={styles.helperText}>{category.helperText}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal Content - slides from left */}
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Drop Your Review 💩</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Scrollable content with keyboard avoiding */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  {/* Location Info */}
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{restroom?.name}</Text>
                    <Text style={styles.locationAddress}>{restroom?.address}</Text>
                  </View>

                  {/* Progress indicator */}
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      Rated {filledCount} of 4 categories
                    </Text>
                    <View style={styles.progressDots}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.progressDot,
                            i < filledCount && styles.progressDotFilled
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* 4 Rating Categories */}
                  {RATING_CATEGORIES.map(renderRatingSection)}

                  <View style={styles.divider} />

                  {/* Photo Section */}
                  <View style={styles.photoSection}>
                    <Text style={styles.photoSectionTitle}>Add Photos (optional)</Text>
                    <Text style={styles.photoHint}>
                      Show what you saw (keep it classy please)
                    </Text>

                    <View style={styles.photoGrid}>
                      {photos.map((photo, index) => (
                        <View key={index} style={styles.photoContainer}>
                          <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                          <TouchableOpacity
                            style={styles.removePhotoButton}
                            onPress={() => removePhoto(index)}
                          >
                            <MaterialIcons name="close" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {photos.length < 3 && (
                        <TouchableOpacity
                          style={styles.addPhotoButton}
                          onPress={showPhotoOptions}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="add-photo-alternate" size={32} color="#6B7280" />
                          <Text style={styles.addPhotoText}>Add Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.photoCount}>
                      {photos.length} / 3 photos
                    </Text>
                  </View>

                  {/* Amenity Confirmation - only show if restroom has amenities */}
                  {restroom?.amenities && Object.keys(restroom.amenities).length > 0 && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.amenitySection}>
                        <AmenityConfirmation
                          existingAmenities={restroom.amenities}
                          confirmedAmenities={confirmedAmenities}
                          deniedAmenities={deniedAmenities}
                          onConfirm={handleConfirmAmenity}
                          onDeny={handleDenyAmenity}
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.divider} />

                  {/* Written Review */}
                  <View style={styles.textSection}>
                    <Text style={styles.textSectionTitle}>Tell us more (optional)</Text>
                    <View style={styles.textInputContainer}>
                      <TextInput
                        ref={textInputRef}
                        style={styles.textInput}
                        placeholder="Any other details worth mentioning?"
                        placeholderTextColor="#999999"
                        value={reviewText}
                        onChangeText={setReviewText}
                        onFocus={handleTextInputFocus}
                        onBlur={handleTextInputBlur}
                        multiline
                        maxLength={MAX_REVIEW_LENGTH}
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={dismissKeyboard}
                        inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_VIEW_ID : undefined}
                      />
                    </View>
                    <Text style={styles.charCount}>
                      {reviewText.length} / {MAX_REVIEW_LENGTH}
                    </Text>
                  </View>

                  {/* Bottom padding - extra tall when keyboard visible to allow scrolling text into view */}
                  <View style={{ height: textInputFocused ? 30 : 160 }} />
                </ScrollView>
              </TouchableWithoutFeedback>

              {/* Submit button - always visible */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !canSubmit && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        {uploadProgress || 'Posting...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {canSubmit ? 'Post Review' : `Rate all 4 categories (${filledCount}/4)`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* iOS Keyboard Accessory View with Done button */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_VIEW_ID}>
          <View style={styles.keyboardToolbar}>
            <View style={styles.keyboardToolbarSpacer} />
            <Button
              title="Done"
              onPress={dismissKeyboard}
              color="#5D4037"
            />
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeX: {
    fontSize: 28,
    color: '#222222',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  locationInfo: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FAF7F5',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#717171',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDDDDD',
  },
  progressDotFilled: {
    backgroundColor: Colors.coral,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  ratingSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  ratingIcon: {
    fontSize: 24,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
    textAlign: 'center',
  },
  starFilled: {
    color: Colors.coral,
  },
  starEmpty: {
    color: Colors.grayLight,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5D4037',
    marginTop: 8,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  textSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  textSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
  },
  textInputContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    width: '100%',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222222',
    lineHeight: 24,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: '#999999',
    marginTop: 8,
  },
  submitContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  submitContainerKeyboard: {
    paddingBottom: 16,
  },
  submitButton: {
    backgroundColor: Colors.coral,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grayLight,
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
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  keyboardToolbarSpacer: {
    flex: 1,
  },
  // Amenity section styles
  amenitySection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  // Photo section styles
  photoSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  photoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  photoCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
});
