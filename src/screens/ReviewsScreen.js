import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, isConfigured } from '../config/firebase';
import { fetchRestrooms } from '../services/restroomService';
import { Colors } from '../constants/colors';

// Badge definitions - Western/vintage style with bathroom humor
const BADGE_DEFINITIONS = [
  {
    id: 'first_review',
    title: 'First Drop',
    description: 'Posted your first review',
    icon: '🎯',
    requirement: 1,
    type: 'review_count',
    color: '#F97316',
  },
  {
    id: 'five_reviews',
    title: 'Getting Regular',
    description: 'Posted 5 reviews',
    icon: '🌟',
    requirement: 5,
    type: 'review_count',
    color: '#10B981',
  },
  {
    id: 'ten_reviews',
    title: 'Throne Expert',
    description: 'Posted 10 reviews',
    icon: '👑',
    requirement: 10,
    type: 'review_count',
    color: '#8B5CF6',
  },
  {
    id: 'twenty_reviews',
    title: 'Porcelain Pioneer',
    description: 'Posted 20 reviews',
    icon: '🚀',
    requirement: 20,
    type: 'review_count',
    color: '#EC4899',
  },
  {
    id: 'photo_reviewer',
    title: 'Picture Perfect',
    description: 'Posted a review with photos',
    icon: '📸',
    requirement: 1,
    type: 'photo_review',
    color: '#3B82F6',
  },
  {
    id: 'five_star',
    title: 'Quality Inspector',
    description: 'Gave a perfect 5-star rating',
    icon: '⭐',
    requirement: 1,
    type: 'five_star',
    color: '#FBBF24',
  },
  {
    id: 'one_star',
    title: 'Stink Spotter',
    description: 'Gave a 1-star rating (the truth hurts)',
    icon: '💩',
    requirement: 1,
    type: 'one_star',
    color: '#78716C',
  },
  {
    id: 'helpful_reviewer',
    title: 'Community Helper',
    description: 'Got 10 helpful votes',
    icon: '👍',
    requirement: 10,
    type: 'helpful_votes',
    color: '#14B8A6',
  },
];

// Calculate which badges user has earned
const calculateBadges = (userReviews) => {
  const earnedBadges = [];

  // Review count badges
  const reviewCount = userReviews.length;
  BADGE_DEFINITIONS
    .filter(b => b.type === 'review_count' && reviewCount >= b.requirement)
    .forEach(badge => earnedBadges.push({ ...badge, earned: true }));

  // Photo review badge
  const hasPhotoReview = userReviews.some(r => r.photos?.length > 0);
  if (hasPhotoReview) {
    const photoBadge = BADGE_DEFINITIONS.find(b => b.id === 'photo_reviewer');
    if (photoBadge) earnedBadges.push({ ...photoBadge, earned: true });
  }

  // Five star badge
  const hasFiveStar = userReviews.some(r => r.averageRating === 5 || r.rating === 5);
  if (hasFiveStar) {
    const fiveStarBadge = BADGE_DEFINITIONS.find(b => b.id === 'five_star');
    if (fiveStarBadge) earnedBadges.push({ ...fiveStarBadge, earned: true });
  }

  // One star badge
  const hasOneStar = userReviews.some(r => r.averageRating <= 1 || r.rating <= 1);
  if (hasOneStar) {
    const oneStarBadge = BADGE_DEFINITIONS.find(b => b.id === 'one_star');
    if (oneStarBadge) earnedBadges.push({ ...oneStarBadge, earned: true });
  }

  // Helpful votes badge
  const totalHelpful = userReviews.reduce((sum, r) => sum + (r.helpful || 0), 0);
  if (totalHelpful >= 10) {
    const helpfulBadge = BADGE_DEFINITIONS.find(b => b.id === 'helpful_reviewer');
    if (helpfulBadge) earnedBadges.push({ ...helpfulBadge, earned: true });
  }

  return earnedBadges;
};

// Format date for display
const formatDate = (timestamp) => {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SORT_OPTIONS = [
  { key: 'date', label: 'Newest', icon: 'schedule' },
  { key: 'rating', label: 'Highest Rated', icon: 'star' },
  { key: 'name', label: 'A-Z', icon: 'sort-by-alpha' },
];

export default function ReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!isConfigured || !db) {
      console.log('[ReviewsScreen] Firebase not configured');
      setLoading(false);
      return;
    }

    try {
      // For now, get reviews by anonymous user
      // Later: filter by actual userId when auth is implemented
      const q = query(
        collection(db, 'reviews'),
        where('userId', '==', 'anonymous')
      );

      const snapshot = await getDocs(q);
      const reviewsData = [];

      snapshot.forEach(docSnap => {
        reviewsData.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort by date, newest first
      reviewsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA;
      });

      // Fetch restroom names for reviews that don't have them
      const reviewsNeedingNames = reviewsData.filter(r => !r.restroomName && r.restroomId);
      if (reviewsNeedingNames.length > 0) {
        try {
          const restrooms = await fetchRestrooms();
          const restroomMap = {};
          restrooms.forEach(r => { restroomMap[r.id] = r.name; });

          // Add names to reviews
          reviewsData.forEach(review => {
            if (!review.restroomName && review.restroomId && restroomMap[review.restroomId]) {
              review.restroomName = restroomMap[review.restroomId];
            }
          });
        } catch (err) {
          console.log('[ReviewsScreen] Could not fetch restroom names:', err.message);
        }
      }

      setReviews(reviewsData);

      // Calculate badges
      const earnedBadges = calculateBadges(reviewsData);
      setBadges(earnedBadges);

      console.log('[ReviewsScreen] Loaded', reviewsData.length, 'reviews,', earnedBadges.length, 'badges');

    } catch (error) {
      console.error('[ReviewsScreen] Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load reviews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
  };

  const deleteReview = (reviewId) => {
    Alert.alert(
      'Delete Review',
      "Are you sure? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reviews', reviewId));
              setReviews(prev => prev.filter(r => r.id !== reviewId));

              // Recalculate badges
              const updatedReviews = reviews.filter(r => r.id !== reviewId);
              const earnedBadges = calculateBadges(updatedReviews);
              setBadges(earnedBadges);

              Alert.alert('Deleted', 'Your review has been removed');
            } catch (error) {
              console.error('[ReviewsScreen] Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          },
        },
      ]
    );
  };

  const currentSortOption = SORT_OPTIONS.find(o => o.key === sortBy);

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA; // Newest first
      case 'rating':
        const ratingA = a.averageRating || a.rating || 0;
        const ratingB = b.averageRating || b.rating || 0;
        return ratingB - ratingA; // Highest first
      case 'name':
        const nameA = (a.restroomName || '').toLowerCase();
        const nameB = (b.restroomName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      default:
        return 0;
    }
  });

  const renderBadgesStrip = () => (
    <View style={styles.badgesSection}>
      <View style={styles.badgesHeader}>
        <Text style={styles.badgesTitle}>Your Badges</Text>
        <Text style={styles.badgesCount}>
          {badges.length} / {BADGE_DEFINITIONS.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {badges.length > 0 ? (
          badges.map((badge, index) => (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badge, { borderColor: badge.color }]}
              onPress={() => Alert.alert(badge.title, badge.description)}
              activeOpacity={0.8}
            >
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeTitle} numberOfLines={2}>{badge.title}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noBadges}>
            <Text style={styles.noBadgesEmoji}>🏆</Text>
            <Text style={styles.noBadgesText}>
              Post reviews to earn badges!
            </Text>
          </View>
        )}

        {/* Show locked badges as preview */}
        {badges.length > 0 && badges.length < BADGE_DEFINITIONS.length && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeIcon}>🔒</Text>
            <Text style={styles.lockedBadgeText}>
              +{BADGE_DEFINITIONS.length - badges.length} more
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderReviewCard = ({ item }) => {
    const rating = item.averageRating || item.rating || 0;

    return (
      <View style={styles.reviewCard}>
        {/* Header with restroom name and delete */}
        <View style={styles.reviewHeader}>
          <View style={styles.reviewHeaderLeft}>
            <Text style={styles.restroomName} numberOfLines={1}>
              {item.restroomName || 'Unknown Location'}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteReview(item.id)}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Star rating display */}
        <View style={styles.ratingDisplay}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={star <= Math.round(rating) ? 'star' : 'star-border'}
                size={18}
                color={star <= Math.round(rating) ? Colors.coral : '#D1D5DB'}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>

        {/* Category breakdown if available */}
        {item.ratings && (
          <View style={styles.categoriesRow}>
            {item.ratings.cleanliness && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  🧹 {item.ratings.cleanliness}/5
                </Text>
              </View>
            )}
            {item.ratings.supplies && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  🧻 {item.ratings.supplies}/5
                </Text>
              </View>
            )}
            {item.ratings.waitTime && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  ⏱️ {item.ratings.waitTime}/5
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Review text */}
        {item.reviewText && (
          <Text style={styles.reviewText} numberOfLines={4}>
            "{item.reviewText}"
          </Text>
        )}

        {/* Photos if any */}
        {item.photos && item.photos.length > 0 && (
          <View style={styles.photoStrip}>
            {item.photos.slice(0, 3).map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photoThumbnail}
              />
            ))}
            {item.photos.length > 3 && (
              <View style={styles.morePhotos}>
                <Text style={styles.morePhotosText}>+{item.photos.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer with helpful count */}
        <View style={styles.reviewFooter}>
          <View style={styles.helpfulContainer}>
            <MaterialIcons name="thumb-up" size={14} color="#6B7280" />
            <Text style={styles.helpfulText}>
              {item.helpful || 0} found helpful
            </Text>
          </View>
          {item.photos && item.photos.length > 0 && (
            <View style={styles.photoIndicator}>
              <MaterialIcons name="photo-camera" size={14} color="#6B7280" />
              <Text style={styles.photoIndicatorText}>{item.photos.length}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Reviews</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Your Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} posted
          </Text>
        </View>

        {/* Sort Button */}
        {reviews.length > 1 && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={currentSortOption?.icon || 'sort'} size={18} color={Colors.coral} />
            <Text style={styles.sortButtonText}>{currentSortOption?.label}</Text>
            <MaterialIcons name={showSortMenu ? 'expand-less' : 'expand-more'} size={18} color={Colors.coral} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortMenuItem,
                sortBy === option.key && styles.sortMenuItemActive,
              ]}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
            >
              <MaterialIcons
                name={option.icon}
                size={20}
                color={sortBy === option.key ? Colors.coral : '#6B7280'}
              />
              <Text style={[
                styles.sortMenuItemText,
                sortBy === option.key && styles.sortMenuItemTextActive,
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <MaterialIcons name="check" size={20} color={Colors.coral} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        ListHeaderComponent={renderBadgesStrip}
        data={sortedReviews}
        renderItem={renderReviewCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.coral}
            colors={[Colors.coral]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>
              Share your bathroom experiences to help others and earn badges!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Find')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="explore" size={20} color="#FFFFFF" />
              <Text style={styles.exploreButtonText}>Find Restrooms</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coral,
  },
  sortMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  sortMenuItemActive: {
    backgroundColor: '#FDF2F2',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 16,
  },
  sortMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  sortMenuItemTextActive: {
    color: Colors.coral,
    fontWeight: '600',
  },

  // Badges section
  badgesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  badgesCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgesScroll: {
    paddingHorizontal: 16,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 12,
  },
  lockedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  lockedBadgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  lockedBadgeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  noBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  noBadgesEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  noBadgesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Review cards
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  restroomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  photoStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  morePhotos: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicatorText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.coral,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
