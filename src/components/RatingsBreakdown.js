import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const RATING_CATEGORIES = [
  { key: 'cleanliness', label: 'Cleanliness', emoji: '🧼' },
  { key: 'supplies', label: 'Supplies', emoji: '🧻' },
  { key: 'accessibility', label: 'Accessibility', emoji: '🚪' },
  { key: 'waitTime', label: 'Wait Time', emoji: '⏱️' },
];

/**
 * Calculate overall rating from 4 categories
 */
const calculateOverallRating = (ratings) => {
  if (!ratings) return 0;
  const values = [
    ratings.cleanliness || 0,
    ratings.supplies || 0,
    ratings.accessibility || 0,
    ratings.waitTime || 0,
  ];
  const validValues = values.filter(v => v > 0);
  if (validValues.length === 0) return 0;
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
};

/**
 * Render star icons for a rating value
 */
const renderStars = (rating, size = 14) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <MaterialIcons key={i} name="star" size={size} color="#F97316" />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <MaterialIcons key={i} name="star-half" size={size} color="#F97316" />
      );
    } else {
      stars.push(
        <MaterialIcons key={i} name="star-outline" size={size} color="#D1D5DB" />
      );
    }
  }
  return stars;
};

/**
 * RatingsBreakdown - Display 4-category ratings breakdown
 *
 * @param {Object} ratings - Object with cleanliness, supplies, accessibility, waitTime
 * @param {boolean} compact - Show compact view (just overall) or full breakdown
 * @param {boolean} showOverallHeader - Show overall rating header above breakdown
 */
export default function RatingsBreakdown({
  ratings,
  compact = false,
  showOverallHeader = true,
  reviewCount = 0,
}) {
  const overall = calculateOverallRating(ratings);
  const hasRatings = ratings && (
    ratings.cleanliness > 0 ||
    ratings.supplies > 0 ||
    ratings.accessibility > 0 ||
    ratings.waitTime > 0
  );

  if (!hasRatings) {
    return (
      <View style={styles.noRatingsContainer}>
        <Text style={styles.noRatingsEmoji}>🌟</Text>
        <Text style={styles.noRatingsText}>No ratings yet</Text>
        <Text style={styles.noRatingsSubtext}>Be the first to review!</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.starsRow}>
          {renderStars(overall, 16)}
        </View>
        <Text style={styles.overallText}>{overall.toFixed(1)}</Text>
        {reviewCount > 0 && (
          <Text style={styles.reviewCountText}>({reviewCount})</Text>
        )}
      </View>
    );
  }

  // Full breakdown view
  return (
    <View style={styles.container}>
      {showOverallHeader && (
        <View style={styles.overallHeader}>
          <Text style={styles.overallRating}>{overall.toFixed(1)}</Text>
          <View style={styles.overallStars}>
            {renderStars(overall, 18)}
          </View>
          {reviewCount > 0 && (
            <Text style={styles.reviewCount}>{reviewCount} reviews</Text>
          )}
        </View>
      )}

      <View style={styles.breakdownContainer}>
        {RATING_CATEGORIES.map(category => {
          const value = ratings[category.key] || 0;
          return (
            <View key={category.key} style={styles.ratingRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.emoji}>{category.emoji}</Text>
                <Text style={styles.label}>{category.label}</Text>
              </View>

              <View style={styles.ratingContainer}>
                <View style={styles.starsRow}>
                  {renderStars(value, 14)}
                </View>
                <Text style={styles.ratingText}>
                  {value > 0 ? value.toFixed(1) : '-'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Compact rating display for cards/lists
 */
export function CompactRating({ rating, reviewCount }) {
  return (
    <View style={styles.compactContainer}>
      <MaterialIcons name="star" size={14} color="#F97316" />
      <Text style={styles.compactRating}>
        {rating > 0 ? rating.toFixed(1) : '-'}
      </Text>
      {reviewCount > 0 && (
        <Text style={styles.compactReviews}>({reviewCount})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  overallRating: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  overallStars: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  breakdownContainer: {
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    minWidth: 28,
    textAlign: 'right',
  },
  overallText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  reviewCountText: {
    fontSize: 14,
    color: '#6B7280',
  },
  noRatingsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FAF7F5',
    borderRadius: 12,
  },
  noRatingsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  noRatingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  noRatingsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  compactRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  compactReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
});
