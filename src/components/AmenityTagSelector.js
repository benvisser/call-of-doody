// src/components/AmenityTagSelector.js
// Compact tag-style amenity selector for AddRestroom and WriteReview screens
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTopAmenities, getAllAmenities, getAmenityById } from '../constants/amenities';

/**
 * Compact tag for selecting/displaying amenities
 */
function AmenityTag({ amenity, selected, onPress, size = 'normal', disabled = false }) {
  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      style={[
        styles.tag,
        isSmall && styles.tagSmall,
        selected && styles.tagSelected,
        disabled && styles.tagDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.tagEmoji, isSmall && styles.tagEmojiSmall]}>
        {amenity.emoji}
      </Text>
      <Text style={[
        styles.tagText,
        isSmall && styles.tagTextSmall,
        selected && styles.tagTextSelected,
      ]}>
        {amenity.name}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Amenity selector for AddRestroomScreen
 * Shows top 8 amenities with "Show More" toggle
 */
export function AmenityTagSelector({ selectedAmenities, onToggle, showCount = 8 }) {
  const [expanded, setExpanded] = useState(false);

  const allAmenities = getAllAmenities();
  const visibleAmenities = expanded ? allAmenities : allAmenities.slice(0, showCount);
  const hiddenCount = allAmenities.length - showCount;

  return (
    <View style={styles.container}>
      <View style={styles.tagGrid}>
        {visibleAmenities.map(amenity => (
          <AmenityTag
            key={amenity.id}
            amenity={amenity}
            selected={selectedAmenities.includes(amenity.id)}
            onPress={() => onToggle(amenity.id)}
          />
        ))}
      </View>

      {hiddenCount > 0 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.showMoreText}>
            {expanded ? '− Show less' : `+ ${hiddenCount} more amenities`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Amenity confirmation for WriteReviewScreen
 * Shows amenities that the restroom has, user can confirm/deny
 */
export function AmenityConfirmation({
  existingAmenities = {},
  confirmedAmenities = [],
  deniedAmenities = [],
  onConfirm,
  onDeny
}) {
  const [expanded, setExpanded] = useState(false);

  // Get amenity IDs from the existing amenities object
  const amenityIds = Object.keys(existingAmenities);

  if (amenityIds.length === 0) {
    return null;
  }

  const visibleIds = expanded ? amenityIds : amenityIds.slice(0, 6);
  const hiddenCount = amenityIds.length - 6;

  return (
    <View style={styles.confirmContainer}>
      <Text style={styles.confirmTitle}>Confirm amenities</Text>
      <Text style={styles.confirmSubtitle}>
        Tap to confirm what you saw (optional)
      </Text>

      <View style={styles.confirmGrid}>
        {visibleIds.map(amenityId => {
          const amenity = getAmenityById(amenityId);
          if (!amenity) return null;

          const isConfirmed = confirmedAmenities.includes(amenityId);
          const isDenied = deniedAmenities.includes(amenityId);

          return (
            <View key={amenityId} style={styles.confirmRow}>
              <View style={styles.confirmAmenity}>
                <Text style={styles.confirmEmoji}>{amenity.emoji}</Text>
                <Text style={styles.confirmName}>{amenity.name}</Text>
              </View>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    styles.confirmBtnYes,
                    isConfirmed && styles.confirmBtnYesActive,
                  ]}
                  onPress={() => onConfirm(amenityId)}
                >
                  <Text style={[
                    styles.confirmBtnText,
                    isConfirmed && styles.confirmBtnTextActive,
                  ]}>
                    ✓
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    styles.confirmBtnNo,
                    isDenied && styles.confirmBtnNoActive,
                  ]}
                  onPress={() => onDeny(amenityId)}
                >
                  <Text style={[
                    styles.confirmBtnText,
                    isDenied && styles.confirmBtnTextActive,
                  ]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {hiddenCount > 0 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.showMoreText}>
            {expanded ? '− Show less' : `+ ${hiddenCount} more`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
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
  tagSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  tagDisabled: {
    opacity: 0.5,
  },
  tagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  tagEmojiSmall: {
    fontSize: 12,
    marginRight: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  tagTextSmall: {
    fontSize: 12,
  },
  tagTextSelected: {
    color: '#5D4037',
    fontWeight: '600',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C17B4A',
  },
  // Confirmation styles
  confirmContainer: {
    marginTop: 8,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#717171',
    marginBottom: 16,
  },
  confirmGrid: {
    gap: 8,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  confirmAmenity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  confirmEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  confirmName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  confirmBtnYes: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  confirmBtnYesActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  confirmBtnNo: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  confirmBtnNoActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmBtnTextActive: {
    color: '#FFFFFF',
  },
});

export default AmenityTagSelector;
