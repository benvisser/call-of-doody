import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getBathroomTypeEmoji } from '../constants/bathroomTypes';

export default function UrgentModeModal({ visible, onClose, restrooms, onDirections }) {
  // Flashing icon animation
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const flash = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      flash.start();

      return () => flash.stop();
    }
  }, [visible, flashAnim]);

  if (!restrooms || restrooms.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
        <SafeAreaView style={styles.container}>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonFloating}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚽</Text>
            <Text style={styles.emptyTitle}>No restrooms found nearby</Text>
            <Text style={styles.emptyText}>
              Try zooming out or moving to a different area
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Calculate time to closest
  const timeToClosest = restrooms.length > 0
    ? Math.max(1, Math.ceil(restrooms[0].distance * 20))
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <SafeAreaView style={styles.container}>
        {/* Floating Close Button */}
        <TouchableOpacity onPress={onClose} style={styles.closeButtonFloating}>
          <MaterialIcons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* URGENT HEADER - INTENSE RED */}
          <View style={styles.urgentHeader}>
            <Animated.View style={[
              styles.urgentIconLarge,
              { opacity: flashAnim }
            ]}>
              <MaterialIcons name="warning" size={56} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.urgentTitle}>OH 💩 MODE</Text>
            <Text style={styles.urgentSubtitle}>
              CODE BROWN • TAP TO SAVE YOURSELF
            </Text>

            {/* Time to closest */}
            {timeToClosest && (
              <View style={styles.timerContainer}>
                <MaterialIcons name="timer" size={20} color="#FCD34D" />
                <Text style={styles.timerText}>
                  {timeToClosest} MIN TO SALVATION
                </Text>
              </View>
            )}
          </View>

          {/* NEAREST RESTROOMS LIST - RED CARDS */}
          <View style={styles.restroomsList}>
            {restrooms.map((restroom, index) => (
              <TouchableOpacity
                key={restroom.id}
                style={[
                  styles.restroomCard,
                  index === 0 && styles.restroomCardClosest,
                ]}
                onPress={() => {
                  onDirections(restroom);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.restroomLeft}>
                  <View style={[
                    styles.rankBadge,
                    index === 0 && styles.rankBadgeClosest
                  ]}>
                    <Text style={[
                      styles.rankText,
                      index === 0 && styles.rankTextClosest
                    ]}>{index + 1}</Text>
                  </View>

                  <View style={styles.restroomInfo}>
                    <Text style={styles.restroomName} numberOfLines={2}>
                      {restroom.name}
                    </Text>

                    <View style={styles.restroomMeta}>
                      {/* Distance */}
                      <View style={styles.metaItem}>
                        <MaterialIcons name="near-me" size={16} color="#FEE2E2" />
                        <Text style={styles.metaText}>
                          {restroom.distance < 0.1
                            ? '<0.1 mi'
                            : `${restroom.distance.toFixed(1)} mi`
                          }
                        </Text>
                      </View>

                      {/* Walking time estimate */}
                      <View style={styles.metaItem}>
                        <MaterialIcons name="directions-walk" size={16} color="#FEE2E2" />
                        <Text style={styles.metaText}>
                          ~{Math.max(1, Math.ceil(restroom.distance * 20))} min walk
                        </Text>
                      </View>
                    </View>

                    {/* Rating if available */}
                    {restroom.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={14} color="#FCD34D" />
                        <Text style={styles.ratingText}>
                          {restroom.rating.toFixed(1)} rating
                        </Text>
                      </View>
                    )}

                    {/* Bathroom types */}
                    {restroom.bathroomTypes && restroom.bathroomTypes.length > 0 && (
                      <View style={styles.bathroomTypes}>
                        {restroom.bathroomTypes.map(typeId => (
                          <Text key={typeId} style={styles.typeEmoji}>
                            {getBathroomTypeEmoji(typeId)}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.restroomRight}>
                  <View style={styles.directionsButton}>
                    <MaterialIcons name="directions" size={28} color="#DC2626" />
                    <Text style={styles.directionsText}>GO</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Helper text */}
          <View style={styles.helperContainer}>
            <MaterialIcons name="info-outline" size={16} color="#FEE2E2" />
            <Text style={styles.helperText}>
              Showing closest restrooms • All filters ignored
            </Text>
          </View>
        </ScrollView>

        {/* MISSION ACCOMPLISHED BUTTON - Floating */}
        <TouchableOpacity
          style={styles.missionButtonFloating}
          onPress={onClose}
          activeOpacity={0.9}
        >
          <MaterialIcons name="check-circle" size={24} color="#10B981" />
          <Text style={styles.missionButtonText}>Mission Accomplished</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626', // Deep red background
  },
  closeButtonFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 66 : 62,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 140, // Extra space for floating button + safe area
  },

  // Urgent Header - INTENSE
  urgentHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: '#DC2626',
  },
  urgentIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 6,
    borderColor: '#991B1B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  urgentTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  urgentSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEE2E2',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B91C1C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 1,
  },

  // Restrooms List - RED CARDS
  restroomsList: {
    padding: 16,
    gap: 16,
  },
  restroomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B91C1C', // Dark red card
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#991B1B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  restroomCardClosest: {
    backgroundColor: '#DC2626', // Lighter red for closest
    borderColor: '#FCD34D', // Gold border for #1
    borderWidth: 4,
    shadowOpacity: 0.5,
  },
  restroomLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7F1D1D', // Very dark red
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#991B1B',
  },
  rankBadgeClosest: {
    backgroundColor: '#FCD34D', // Gold for #1
    borderColor: '#F59E0B',
  },
  rankText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rankTextClosest: {
    color: '#7F1D1D',
  },
  restroomInfo: {
    flex: 1,
  },
  restroomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  restroomMeta: {
    gap: 6,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#FEE2E2',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#FCD34D',
    fontWeight: '600',
  },
  bathroomTypes: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  typeEmoji: {
    fontSize: 18,
  },
  restroomRight: {
    marginLeft: 12,
  },
  directionsButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Helper
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  helperText: {
    fontSize: 13,
    color: '#FEE2E2',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Floating Mission Accomplished Button
  missionButtonFloating: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  missionButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#FEE2E2',
    textAlign: 'center',
    lineHeight: 22,
  },
});
