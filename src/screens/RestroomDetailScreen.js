import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getAmenityById } from '../constants/amenities';
import BathroomTypesDisplay from '../components/BathroomTypesDisplay';

export default function RestroomDetailScreen({ route, navigation }) {
  const { restroom } = route.params;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    return stars.join('');
  };

  // Helper to get amenity IDs from restroom data (handles both old array and new object format)
  const getAmenityIds = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    return Object.keys(amenities);
  };

  const renderAmenities = () => {
    return getAmenityIds(restroom.amenities).map((amenityId) => {
      const amenity = getAmenityById(amenityId);
      if (!amenity) return null;
      return (
        <View key={amenityId} style={styles.amenityTag}>
          <Text style={styles.amenityTagEmoji}>{amenity.emoji}</Text>
          <Text style={styles.amenityTagText}>{amenity.name}</Text>
        </View>
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{restroom.name}</Text>
        <Text style={styles.address}>{restroom.address}</Text>
      </View>

      <View style={styles.ratingContainer}>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Overall Rating:</Text>
          <Text style={styles.ratingValue}>
            {renderStars(restroom.rating)} {restroom.rating.toFixed(1)}
          </Text>
        </View>
        <Text style={styles.reviewCount}>{restroom.reviews} reviews</Text>
      </View>

      <View style={styles.cleanlinessContainer}>
        <Text style={styles.sectionTitle}>Cleanliness</Text>
        <View style={styles.cleanlinessBar}>
          {[1, 2, 3, 4, 5].map((level) => (
            <View
              key={level}
              style={[
                styles.cleanlinessBlock,
                level <= restroom.cleanliness && styles.cleanlinessBlockFilled,
              ]}
            />
          ))}
        </View>
        <Text style={styles.cleanlinessText}>
          {restroom.cleanliness}/5 - {restroom.cleanliness >= 4 ? 'Very Clean' : restroom.cleanliness >= 3 ? 'Clean' : 'Needs Improvement'}
        </Text>
      </View>

      <View style={styles.amenitiesContainer}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {renderAmenities()}
        </View>
      </View>

      {restroom.bathroomTypes && restroom.bathroomTypes.length > 0 && (
        <View style={styles.genderContainer}>
          <Text style={styles.sectionTitle}>Bathroom type</Text>
          <BathroomTypesDisplay bathroomTypes={restroom.bathroomTypes} />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.directionsButton}>
          <Text style={styles.buttonText}>🗺️ Get Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reviewButton}>
          <Text style={styles.buttonText}>✍️ Write a Review</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentReviews}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewAuthor}>John D. • 2 days ago</Text>
          <Text style={styles.reviewText}>
            ⭐⭐⭐⭐ Very clean and well-maintained. Easy to find!
          </Text>
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewAuthor}>Sarah M. • 1 week ago</Text>
          <Text style={styles.reviewText}>
            ⭐⭐⭐⭐⭐ Spotless! Has changing table which was a lifesaver.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#666',
  },
  ratingContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cleanlinessContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cleanlinessBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cleanlinessBlock: {
    flex: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginRight: 5,
    borderRadius: 4,
  },
  cleanlinessBlockFilled: {
    backgroundColor: '#4CAF50',
  },
  cleanlinessText: {
    fontSize: 14,
    color: '#666',
  },
  amenitiesContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amenityTagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  amenityTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  genderContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentReviews: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
  },
});
