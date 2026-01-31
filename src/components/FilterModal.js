import React, { useRef, useEffect } from 'react';
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
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AMENITY_OPTIONS = [
  { key: 'accessible', icon: '♿️', label: 'Accessible' },
  { key: 'changing_table', icon: '👶', label: 'Changing Table' },
  { key: 'family', icon: '👨‍👩‍👧', label: 'Family Room' },
  { key: 'toilets', icon: '🚽', label: 'Multiple Stalls' },
  { key: 'paper_towels', icon: '🧻', label: 'Paper Towels' },
  { key: 'hand_dryer', icon: '💨', label: 'Hand Dryer' },
];

const ACCESS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'public', label: 'Public Only' },
  { key: 'private', label: 'Private Only' },
];

const CLEANLINESS_OPTIONS = [
  { key: 'any', label: 'Any', min: 0 },
  { key: '3+', label: '3+', sublabel: 'Clean', min: 3 },
  { key: '4+', label: '4+', sublabel: 'Very Clean', min: 4 },
  { key: '5', label: '5', sublabel: 'Spotless ✨', min: 5 },
];

const DISTANCE_OPTIONS = [
  { key: 'any', label: 'Any', max: Infinity },
  { key: '1', label: '< 1 mile', max: 1 },
  { key: '5', label: '< 5 miles', max: 5 },
  { key: '10', label: '< 10 miles', max: 10 },
];

export default function FilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  resultCount,
  hasUserLocation,
  onClearAll,
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenityKey) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenityKey)
      ? currentAmenities.filter((a) => a !== amenityKey)
      : [...currentAmenities, amenityKey];
    updateFilter('amenities', newAmenities);
  };

  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <TouchableWithoutFeedback onPress={closeWithAnimation}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={closeWithAnimation} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Filters</Text>
                <View style={styles.closeButton} />
              </View>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Access Type Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Access Type</Text>
                  <View style={styles.pillContainer}>
                    {ACCESS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.pill,
                          filters.accessType === option.key && styles.pillSelected,
                        ]}
                        onPress={() => updateFilter('accessType', option.key)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            filters.accessType === option.key && styles.pillTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Amenities Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <View style={styles.amenitiesGrid}>
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = (filters.amenities || []).includes(amenity.key);
                      return (
                        <TouchableOpacity
                          key={amenity.key}
                          style={[
                            styles.amenityPill,
                            isSelected && styles.amenityPillSelected,
                          ]}
                          onPress={() => toggleAmenity(amenity.key)}
                        >
                          <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                          <Text
                            style={[
                              styles.amenityLabel,
                              isSelected && styles.amenityLabelSelected,
                            ]}
                          >
                            {amenity.label}
                          </Text>
                          {isSelected && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Cleanliness Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Minimum Cleanliness</Text>
                  <View style={styles.pillContainer}>
                    {CLEANLINESS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.cleanPill,
                          filters.cleanliness === option.key && styles.pillSelected,
                        ]}
                        onPress={() => updateFilter('cleanliness', option.key)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            filters.cleanliness === option.key && styles.pillTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.sublabel && (
                          <Text
                            style={[
                              styles.pillSubtext,
                              filters.cleanliness === option.key && styles.pillSubtextSelected,
                            ]}
                          >
                            {option.sublabel}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Distance Section - only show if user location available */}
                {hasUserLocation && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Distance from you</Text>
                      <View style={styles.pillContainer}>
                        {DISTANCE_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option.key}
                            style={[
                              styles.pill,
                              filters.distance === option.key && styles.pillSelected,
                            ]}
                            onPress={() => updateFilter('distance', option.key)}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                filters.distance === option.key && styles.pillTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.divider} />
                  </>
                )}

                <View style={{ height: 120 }} />
              </ScrollView>

              {/* Bottom Action Bar */}
              <View style={styles.bottomBar}>
                <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear all</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeWithAnimation} style={styles.showButton}>
                  <Text style={styles.showButtonText}>
                    Show {resultCount} restroom{resultCount !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Export constants for use in MapScreen
export { AMENITY_OPTIONS, ACCESS_OPTIONS, CLEANLINESS_OPTIONS, DISTANCE_OPTIONS };

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#222222',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 24,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  pillSelected: {
    backgroundColor: '#5D4037',
    borderColor: '#5D4037',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  pillSubtext: {
    fontSize: 11,
    color: '#717171',
    marginTop: 2,
  },
  pillSubtextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cleanPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  amenityPillSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  amenityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  amenityLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },
  amenityLabelSelected: {
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5D4037',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    textDecorationLine: 'underline',
  },
  showButton: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#5D4037',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  showButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
