import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { getFavorites, removeFavorite } from '../utils/favoritesStorage';
import { fetchRestrooms } from '../services/restroomService';
import { formatDistance, addDistanceToRestrooms } from '../utils/distance';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from '../components/LoginPrompt';

const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest', icon: 'near-me' },
  { key: 'rating', label: 'Top Rated', icon: 'star' },
  { key: 'name', label: 'A-Z', icon: 'sort-by-alpha' },
];

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('[FavoritesScreen] Error getting location:', error);
      }
    };
    getLocation();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const favoriteIds = await getFavorites();
      const allRestrooms = await fetchRestrooms();

      // Filter restrooms to only show favorites
      let favoriteRestrooms = allRestrooms.filter(
        restroom => favoriteIds.includes(restroom.id)
      );

      // Add distance if user location is available
      if (userLocation) {
        favoriteRestrooms = addDistanceToRestrooms(favoriteRestrooms, userLocation);
      }

      setFavorites(favoriteRestrooms);
    } catch (error) {
      console.error('[FavoritesScreen] Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation]);

  // Reload favorites when screen comes into focus or location changes
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (restroomId) => {
    await removeFavorite(restroomId);
    setFavorites(prev => prev.filter(r => r.id !== restroomId));
  };

  const handleViewRestroom = (restroom) => {
    navigation.navigate('Find', { selectedRestroomId: restroom.id });
  };

  // Sort favorites based on selected option
  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        // If no distance data, put at end
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const currentSortOption = SORT_OPTIONS.find(o => o.key === sortBy);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <MaterialIcons key={i} name="star" size={14} color={Colors.coral} style={styles.starIcon} />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <MaterialIcons key={i} name="star-half" size={14} color={Colors.coral} style={styles.starIcon} />
        );
      } else {
        stars.push(
          <MaterialIcons key={i} name="star-border" size={14} color="#D1D5DB" style={styles.starIcon} />
        );
      }
    }
    return stars;
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewRestroom(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x300/F5F5F5/999?text=No+Image' }}
        style={styles.cardImage}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="favorite" size={22} color="#FF385C" />
      </TouchableOpacity>

      {/* Distance badge */}
      {item.distance !== undefined && (
        <View style={styles.distanceBadge}>
          <MaterialIcons name="near-me" size={12} color="#FFFFFF" />
          <Text style={styles.distanceBadgeText}>{formatDistance(item.distance)}</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {renderStars(item.rating)}
          </View>
          <Text style={styles.ratingNumber}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
        </View>

        <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>

        <View style={styles.amenitiesPreview}>
          {item.amenities?.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityTagText}>
                {amenity === 'accessible' ? '♿️' :
                 amenity === 'changing_table' ? '👶' :
                 amenity === 'family' ? '👨‍👩‍👧' :
                 amenity === 'toilets' ? '🚽' :
                 amenity === 'sinks' ? '💧' : '✓'}
              </Text>
            </View>
          ))}
          {item.amenities?.length > 3 && (
            <Text style={styles.moreAmenities}>+{item.amenities.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show auth loading state
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated && showLoginPrompt) {
    return (
      <LoginPrompt
        feature="favorites"
        onLogin={() => navigation.navigate('Auth', { feature: 'favorites' })}
        onSkip={() => setShowLoginPrompt(false)}
        showSkip={true}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favorites</Text>
          {favorites.length > 0 && (
            <Text style={styles.headerCount}>{favorites.length} saved</Text>
          )}
        </View>

        {/* Sort Button */}
        {favorites.length > 1 && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={currentSortOption?.icon || 'sort'} size={18} color={Colors.coral} />
            <Text style={styles.sortButtonText}>{currentSortOption?.label}</Text>
            <MaterialIcons name={showSortMenu ? 'expand-less' : 'expand-more'} size={18} color={Colors.coral} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortMenuItem,
                sortBy === option.key && styles.sortMenuItemActive,
              ]}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
            >
              <MaterialIcons
                name={option.icon}
                size={20}
                color={sortBy === option.key ? Colors.coral : '#6B7280'}
              />
              <Text style={[
                styles.sortMenuItemText,
                sortBy === option.key && styles.sortMenuItemTextActive,
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <MaterialIcons name="check" size={20} color={Colors.coral} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="favorite-border" size={48} color="#CCCCCC" />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any restroom to save it here for quick access.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.exploreButtonText}>Explore Restrooms</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedFavorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.coral}
              colors={[Colors.coral]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coral,
  },
  sortMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  sortMenuItemActive: {
    backgroundColor: '#FDF2F2',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 16,
  },
  sortMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  sortMenuItemTextActive: {
    color: Colors.coral,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  starIcon: {
    marginRight: 1,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  amenitiesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityTagText: {
    fontSize: 14,
  },
  moreAmenities: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  exploreButton: {
    backgroundColor: Colors.coral,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
