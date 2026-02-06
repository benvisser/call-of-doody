import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBathroomTypeById } from '../constants/bathroomTypes';

export default function BathroomTypesDisplay({ bathroomTypes, compact = false }) {
  if (!bathroomTypes || bathroomTypes.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view - just emojis in a row
    return (
      <View style={styles.compactContainer}>
        {bathroomTypes.map(typeId => {
          const type = getBathroomTypeById(typeId);
          return type ? (
            <Text key={typeId} style={styles.compactEmoji}>
              {type.emoji}
            </Text>
          ) : null;
        })}
      </View>
    );
  }

  // Full view - chip badges with labels
  return (
    <View style={styles.container}>
      {bathroomTypes.map(typeId => {
        const type = getBathroomTypeById(typeId);
        return type ? (
          <View key={typeId} style={styles.typeBadge}>
            <Text style={styles.badgeEmoji}>{type.emoji}</Text>
            <Text style={styles.badgeText}>{type.label}</Text>
          </View>
        ) : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  compactEmoji: {
    fontSize: 18,
  },
});
