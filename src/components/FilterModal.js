import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { getAllAmenities } from '../constants/amenities';
import { BATHROOM_TYPES } from '../constants/bathroomTypes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Top amenities to show (expanded on "Show more")
const TOP_AMENITY_IDS = [
  'wheelchair_accessible',
  'changing_table',
  'toilet_paper',
  'soap',
  'privacy_lock',
  'paper_towels',
  'hand_dryer',
  'multiple_stalls',
];

const ACCESS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Private' },
];

const CLEANLINESS_OPTIONS = [
  { key: 'any', label: 'Any', min: 0 },
  { key: '3+', label: '3+ ⭐', min: 3 },
  { key: '4+', label: '4+ ⭐', min: 4 },
];

const DISTANCE_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: '1', label: '< 1 mi' },
  { key: '5', label: '< 5 mi' },
  { key: '10', label: '< 10 mi' },
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
  const [showAllAmenities, setShowAllAmenities] = useState(false);

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

  const toggleBathroomType = (typeId) => {
    const currentTypes = filters.bathroomTypes || [];
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter((t) => t !== typeId)
      : [...currentTypes, typeId];
    updateFilter('bathroomTypes', newTypes);
  };

  const handleClearAll = () => {
    setShowAllAmenities(false);
    onClearAll();
  };

  // Get amenities to display
  const allAmenities = getAllAmenities();
  const topAmenities = allAmenities.filter(a => TOP_AMENITY_IDS.includes(a.id));
  const moreAmenities = allAmenities.filter(a => !TOP_AMENITY_IDS.includes(a.id));
  const displayedAmenities = showAllAmenities ? allAmenities : topAmenities;

  // Count active filters
  const activeFilterCount = [
    filters.accessType !== 'all' ? 1 : 0,
    (filters.amenities || []).length,
    (filters.bathroomTypes || []).length,
    filters.cleanliness !== 'any' ? 1 : 0,
    filters.distance !== 'any' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation} statusBarTranslucent>
      <View style={styles.backdrop} pointerEvents="box-none">
        <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={closeWithAnimation} />
        </Animated.View>
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
              <View style={styles.tagGrid}>
                {ACCESS_OPTIONS.map((option) => {
                  const isSelected = filters.accessType === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.tag, isSelected && styles.tagSelected]}
                      onPress={() => updateFilter('accessType', option.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bathroom Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bathroom Type</Text>
              <View style={styles.tagGrid}>
                {BATHROOM_TYPES.map((type) => {
                  const isSelected = (filters.bathroomTypes || []).includes(type.id);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.tag, isSelected && styles.tagSelected]}
                      onPress={() => toggleBathroomType(type.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagEmoji}>{type.emoji}</Text>
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Amenities Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.tagGrid}>
                {displayedAmenities.map((amenity) => {
                  const isSelected = (filters.amenities || []).includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[styles.tag, isSelected && styles.tagSelected]}
                      onPress={() => toggleAmenity(amenity.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagEmoji}>{amenity.emoji}</Text>
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {amenity.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {moreAmenities.length > 0 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllAmenities(!showAllAmenities)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllAmenities ? 'Show less' : `Show ${moreAmenities.length} more`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {/* Minimum Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.tagGrid}>
                {CLEANLINESS_OPTIONS.map((option) => {
                  const isSelected = filters.cleanliness === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.tag, isSelected && styles.tagSelected]}
                      onPress={() => updateFilter('cleanliness', option.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Distance Section - only show if user location available */}
            {hasUserLocation && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Distance</Text>
                  <View style={styles.tagGrid}>
                    {DISTANCE_OPTIONS.map((option) => {
                      const isSelected = filters.distance === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          style={[styles.tag, isSelected && styles.tagSelected]}
                          onPress={() => updateFilter('distance', option.key)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
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
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Export constants for use in MapScreen
const AMENITY_OPTIONS = TOP_AMENITY_IDS.map(id => {
  const amenity = getAllAmenities().find(a => a.id === id);
  return amenity ? { key: amenity.id, icon: amenity.emoji, label: amenity.name } : null;
}).filter(Boolean);

export { AMENITY_OPTIONS, ACCESS_OPTIONS, CLEANLINESS_OPTIONS, DISTANCE_OPTIONS, BATHROOM_TYPES };

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85,
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
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 24,
  },
  // Tag/Chip styles
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tagSelected: {
    borderColor: '#5D4037',
    backgroundColor: '#FAF7F5',
  },
  tagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tagTextSelected: {
    color: '#5D4037',
    fontWeight: '600',
  },
  showMoreButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
    textDecorationLine: 'underline',
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
    backgroundColor: Colors.coral,
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
