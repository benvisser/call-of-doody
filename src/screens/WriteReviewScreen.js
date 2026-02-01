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
} from 'react-native';
import { submitReview } from '../services/reviewService';
import {
  RATING_CATEGORIES,
  getCategoryLabel,
  calculateAverageFromRatings,
  hasAllRatings,
  countFilledRatings,
} from '../utils/reviewHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_REVIEW_LENGTH = 500;
const INPUT_ACCESSORY_VIEW_ID = 'reviewTextInputAccessory';

export default function WriteReviewScreen({ visible, onClose, restroom, onSuccess }) {
  // Form state - 4 category ratings
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    supplies: 0,
    accessibility: 0,
    waitTime: 0,
  });
  const [reviewText, setReviewText] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const hasContent = countFilledRatings(ratings) > 0 || reviewText.trim().length > 0;

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
  };

  const canSubmit = hasAllRatings(ratings) && !isSubmitting;
  const filledCount = countFilledRatings(ratings);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      const averageRating = calculateAverageFromRatings(ratings);

      const reviewData = {
        restroomId: restroom.id,
        ratings,
        averageRating,
        reviewText: reviewText.trim(),
      };

      console.log('[WriteReview] Submitting review:', reviewData);
      const result = await submitReview(reviewData);

      if (result.success) {
        console.log('[WriteReview] Review submitted successfully');

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
                      <Text style={styles.submitButtonText}>Posting...</Text>
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
    backgroundColor: '#8B7355',
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
    color: '#8B7355',
  },
  starEmpty: {
    color: '#DDDDDD',
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
    backgroundColor: '#8B7355',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
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
});
