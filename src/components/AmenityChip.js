// src/components/AmenityChip.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function AmenityChip({ amenity, selected, onToggle, disabled = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{amenity.emoji}</Text>
      <Text style={[
        styles.text,
        selected && styles.textSelected,
      ]}>
        {amenity.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: '#C17B4A',
    backgroundColor: '#FFF8F0',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textSelected: {
    color: '#C17B4A',
    fontWeight: '600',
  },
});
