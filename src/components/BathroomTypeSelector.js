import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BATHROOM_TYPES } from '../constants/bathroomTypes';

export default function BathroomTypeSelector({ selectedTypes, onToggle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bathroom Types</Text>
      <Text style={styles.subtitle}>
        Select all that apply (multiple options OK)
      </Text>

      <View style={styles.typesGrid}>
        {BATHROOM_TYPES.map(type => {
          const isSelected = selectedTypes.includes(type.id);
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                isSelected && styles.typeChipSelected,
              ]}
              onPress={() => onToggle(type.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <View style={styles.typeTextContainer}>
                <Text style={[
                  styles.typeLabel,
                  isSelected && styles.typeLabelSelected,
                ]}>
                  {type.label}
                </Text>
                {!isSelected && (
                  <Text style={styles.typeDescription}>{type.description}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.helperContainer}>
        <Text style={styles.helperEmoji}>💡</Text>
        <Text style={styles.helperText}>
          Many restrooms have multiple types (e.g., Men's + Women's + Family)
        </Text>
      </View>
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
  typesGrid: {
    gap: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  typeChipSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  typeEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  typeLabelSelected: {
    color: '#5D4037',
  },
  typeDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  helperEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
