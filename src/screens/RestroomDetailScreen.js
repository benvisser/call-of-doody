import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

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

  const renderAmenities = () => {
    const amenityIcons = {
      toilets: '🚽',
      urinals: '🚹',
      accessible: '♿',
      changing_table: '👶',
      family: '👨‍👩‍👧‍👦',
      sinks: '🚰',
    };

    return restroom.amenities.map((amenity, index) => (
      <View key={index} style={styles.amenityChip}>
        <Text style={styles.amenityText}>
          {amenityIcons[amenity] || '✓'} {amenity.replace('_', ' ')}
        </Text>
      </View>
    ));
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

      <View style={styles.genderContainer}>
        <Text style={styles.sectionTitle}>Facilities</Text>
        <Text style={styles.genderText}>
          {restroom.gender === 'unisex' ? '🚻 Unisex / All-Gender' : '🚹🚺 Separate Men\'s & Women\'s'}
        </Text>
      </View>

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
  },
  amenityChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  genderContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  genderText: {
    fontSize: 16,
    color: '#666',
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
