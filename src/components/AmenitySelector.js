// src/components/AmenitySelector.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AmenityChip from './AmenityChip';
import { getTopAmenities, getAllAmenities } from '../constants/amenities';

export default function AmenitySelector({ selectedAmenities, onToggle }) {
  const [showAll, setShowAll] = useState(false);

  const topAmenities = getTopAmenities(5);
  const allAmenities = getAllAmenities();
  const extendedAmenities = allAmenities.slice(5);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amenities</Text>
      <Text style={styles.subtitle}>
        What does this restroom have?
      </Text>

      {/* Top 5 amenities */}
      <View style={styles.chipContainer}>
        {topAmenities.map(amenity => (
          <AmenityChip
            key={amenity.id}
            amenity={amenity}
            selected={selectedAmenities.includes(amenity.id)}
            onToggle={() => onToggle(amenity.id)}
          />
        ))}
      </View>

      {/* Show All toggle */}
      <TouchableOpacity
        style={styles.showAllButton}
        onPress={() => setShowAll(!showAll)}
      >
        <Text style={styles.showAllText}>
          {showAll ? '− Show Less' : `+ Show All (${allAmenities.length} total)`}
        </Text>
      </TouchableOpacity>

      {/* Extended amenities */}
      {showAll && (
        <View style={styles.chipContainer}>
          {extendedAmenities.map(amenity => (
            <AmenityChip
              key={amenity.id}
              amenity={amenity}
              selected={selectedAmenities.includes(amenity.id)}
              onToggle={() => onToggle(amenity.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  showAllButton: {
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C17B4A',
  },
});
