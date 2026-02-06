// src/components/AmenityVerificationModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAmenityById } from '../constants/amenities';
import { voteOnAmenity } from '../utils/amenityVoting';
import { useAuth } from '../context/AuthContext';

export default function AmenityVerificationModal({
  visible,
  onClose,
  restroom,
}) {
  const { user } = useAuth();
  const [votes, setVotes] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleVote = (amenityId, vote) => {
    setVotes({
      ...votes,
      [amenityId]: vote,
    });
  };

  const submitVerifications = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to verify amenities');
      return;
    }

    if (Object.keys(votes).length === 0) {
      Alert.alert('No Votes', 'Please vote on at least one amenity');
      return;
    }

    try {
      setSubmitting(true);

      const votePromises = Object.entries(votes).map(([amenityId, vote]) =>
        voteOnAmenity(restroom.id, amenityId, user.uid, vote)
      );

      await Promise.all(votePromises);

      Alert.alert(
        'Thanks!',
        `Your ${Object.keys(votes).length} verification(s) help keep our data accurate!`
      );

      setVotes({});
      onClose();

    } catch (error) {
      console.error('Submit verification error:', error);
      if (error.message.includes('already voted')) {
        Alert.alert('Already Verified', 'You\'ve already verified these amenities');
      } else {
        Alert.alert('Error', 'Failed to submit verifications');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const amenityEntries = Object.entries(restroom?.amenities || {});

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Amenities</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.instructions}>
              Help others by confirming what this restroom has. Your votes keep our data accurate!
            </Text>

            {amenityEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No amenities listed for this restroom yet.
                </Text>
              </View>
            ) : (
              amenityEntries.map(([amenityId, data]) => {
                const amenity = getAmenityById(amenityId);
                if (!amenity) return null;

                const userVote = votes[amenityId];

                return (
                  <View key={amenityId} style={styles.verifyRow}>
                    <View style={styles.verifyLeft}>
                      <Text style={styles.amenityEmoji}>{amenity.emoji}</Text>
                      <View style={styles.amenityInfo}>
                        <Text style={styles.amenityName}>{amenity.name}</Text>
                        {data.votes > 0 && (
                          <Text style={styles.currentStatus}>
                            Currently: {data.percentage}% confirm ({data.votes} votes)
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.confirmButton,
                          userVote === 'confirm' && styles.confirmButtonActive,
                        ]}
                        onPress={() => handleVote(amenityId, 'confirm')}
                      >
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={userVote === 'confirm' ? '#FFFFFF' : '#10B981'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.denyButton,
                          userVote === 'deny' && styles.denyButtonActive,
                        ]}
                        onPress={() => handleVote(amenityId, 'deny')}
                      >
                        <MaterialIcons
                          name="close"
                          size={20}
                          color={userVote === 'deny' ? '#FFFFFF' : '#EF4444'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Submit button */}
            {amenityEntries.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submitting || Object.keys(votes).length === 0) && styles.submitButtonDisabled,
                ]}
                onPress={submitVerifications}
                disabled={submitting || Object.keys(votes).length === 0}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Submit {Object.keys(votes).length > 0 && `(${Object.keys(votes).length})`}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  verifyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  amenityInfo: {
    flex: 1,
  },
  amenityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  currentStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  confirmButton: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  confirmButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  denyButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  denyButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C17B4A',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
