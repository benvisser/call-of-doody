// src/components/AmenityDisplay.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAmenityById } from '../constants/amenities';

export default function AmenityDisplay({ amenityId, data }) {
  const amenity = getAmenityById(amenityId);

  if (!amenity) return null;

  // Don't show removed amenities
  if (data?.status === 'removed') return null;

  const getStatusColor = () => {
    switch (data?.status) {
      case 'confirmed': return '#10B981';
      case 'disputed': return '#F59E0B';
      case 'unverified': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (data?.status) {
      case 'confirmed': return '✓';
      case 'disputed': return '?';
      case 'unverified': return '·';
      default: return '·';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{amenity.emoji}</Text>
      <Text style={styles.name}>{amenity.name}</Text>

      {data?.votes >= 1 && (
        <View style={[styles.badge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor() }]}>
            {getStatusIcon()} {data.percentage}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
