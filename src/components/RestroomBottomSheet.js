import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import { getAmenityById } from '../constants/amenities';
import BathroomTypesDisplay from './BathroomTypesDisplay';
import RatingsBreakdown from './RatingsBreakdown';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;
const SWIPE_THRESHOLD = 50;

export default function RestroomBottomSheet({ visible, restroom, onClose }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Pan responder ONLY for handle - doesn't block scroll
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderGrant: () => setScrollEnabled(false),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        setScrollEnabled(true);
        if (gestureState.dy > SWIPE_THRESHOLD || gestureState.vy > 0.5) {
          closeWithAnimation();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      panY.setValue(0);
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!restroom) return null;

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

  // Helper to get amenity IDs from restroom data (handles both old array and new object format)
  const getAmenityIds = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    return Object.keys(amenities);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <TouchableWithoutFeedback onPress={closeWithAnimation}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalContainer, { transform: [{ translateY: Animated.add(slideAnim, panY) }] }]}>
              
              <View style={styles.handleContainer} {...panResponder.panHandlers}>
                <View style={styles.handle} />
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={scrollEnabled}
                bounces={true}
              >
                <View style={styles.imageSection}>
                  <Image source={{ uri: restroom.imageUrl || 'https://via.placeholder.com/400x300/F5F5F5/999?text=No+Image' }} style={styles.heroImage} />
                  <View style={styles.accessBadge}>
                    <Text style={styles.accessBadgeText}>{restroom.isPrivate ? 'Private' : 'Public'}</Text>
                  </View>
                </View>

                <View style={styles.headerSection}>
                  <Text style={styles.title}>{restroom.name}</Text>
                  <View style={styles.ratingRow}>
                    <View style={styles.starsContainer}>
                      {renderStars(restroom.rating)}
                      <Text style={styles.ratingNumber}>{restroom.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.reviewCount}>({restroom.reviews} reviews)</Text>
                  </View>
                  <Text style={styles.address}>{restroom.address}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ratings</Text>
                  <RatingsBreakdown
                    ratings={restroom.ratings || {
                      cleanliness: restroom.cleanliness || 0,
                      supplies: 0,
                      accessibility: 0,
                      waitTime: 0,
                    }}
                    reviewCount={restroom.reviewCount || restroom.reviews || 0}
                    showOverallHeader={false}
                  />
                </View>

                <View style={styles.divider} />

                {/* Bathroom Type Section */}
                {restroom.bathroomTypes && restroom.bathroomTypes.length > 0 && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Bathroom type</Text>
                      <BathroomTypesDisplay bathroomTypes={restroom.bathroomTypes} />
                    </View>
                    <View style={styles.divider} />
                  </>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What this place offers</Text>
                  <View style={styles.amenityTagGrid}>
                    {getAmenityIds(restroom.amenities).map((amenityId) => {
                      const amenity = getAmenityById(amenityId);
                      if (!amenity) return null;
                      return (
                        <View key={amenityId} style={styles.amenityTag}>
                          <Text style={styles.amenityTagEmoji}>{amenity.emoji}</Text>
                          <Text style={styles.amenityTagText}>{amenity.name}</Text>
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
                    <Text style={styles.reviewText}>Exceptionally clean! The changing table was a lifesaver.</Text>
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
                    <Text style={styles.showAllText}>Show all {restroom.reviews} reviews</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
              </ScrollView>

              <View style={styles.bottomBar}>
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Free</Text>
                  <Text style={styles.priceSubtext}>Public access</Text>
                </View>
                <TouchableOpacity style={styles.directionsButton}>
                  <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContainer: { height: MODAL_HEIGHT, backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handleContainer: { paddingTop: 8, paddingBottom: 8, alignItems: 'center', zIndex: 10 },
  handle: { width: 32, height: 4, backgroundColor: '#DDD', borderRadius: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  imageSection: { width: '100%', height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%', backgroundColor: '#F7F7F7' },
  accessBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  accessBadgeText: { fontSize: 12, fontWeight: '600', color: '#222' },
  headerSection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '600', color: '#222', marginBottom: 8, letterSpacing: -0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  starsContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  starFilled: { fontSize: 14, color: '#FF385C', marginRight: 1 },
  starHalf: { fontSize: 14, color: '#FF385C', marginRight: 1 },
  starEmpty: { fontSize: 14, color: '#DDD', marginRight: 1 },
  ratingNumber: { fontSize: 14, fontWeight: '600', color: '#222', marginLeft: 6 },
  reviewCount: { fontSize: 14, color: '#717171' },
  address: { fontSize: 15, color: '#717171', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#EBEBEB', marginHorizontal: 24, marginVertical: 24 },
  section: { paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: '#222', marginBottom: 16 },
  cleanlinessLabel: { fontSize: 14, fontWeight: '600', color: '#008489' },
  cleanlinessBar: { flexDirection: 'row', gap: 4, height: 6 },
  cleanlinessSegment: { flex: 1, backgroundColor: '#EBEBEB', borderRadius: 3 },
  cleanlinessActive: { backgroundColor: '#008489' },
  amenitiesGrid: { gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  amenityIcon: { fontSize: 20, width: 32 },
  amenityText: { fontSize: 16, color: '#222', marginLeft: 8 },
  amenityTagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FAF7F5', borderWidth: 1, borderColor: '#E5E7EB' },
  amenityTagEmoji: { fontSize: 14, marginRight: 6 },
  amenityTagText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  reviewItem: { marginBottom: 32 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  reviewerName: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 2 },
  reviewDate: { fontSize: 14, color: '#717171' },
  reviewStars: { flexDirection: 'row', marginBottom: 12 },
  reviewText: { fontSize: 15, lineHeight: 24, color: '#222' },
  showAllReviews: { marginTop: 8, paddingVertical: 16, borderWidth: 1, borderColor: '#222', borderRadius: 8, alignItems: 'center' },
  showAllText: { fontSize: 16, fontWeight: '600', color: '#222' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EBEBEB', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  priceSection: { flex: 1 },
  priceLabel: { fontSize: 16, fontWeight: '600', color: '#222' },
  priceSubtext: { fontSize: 14, color: '#717171' },
  directionsButton: { backgroundColor: '#FF385C', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  directionsButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
