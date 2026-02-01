import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Application from 'expo-application';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isConfigured } from '../config/firebase';
import { getFavorites } from '../utils/favoritesStorage';
import { Colors } from '../constants/colors';

// Badge definitions (same as ReviewsScreen)
const BADGE_DEFINITIONS = [
  {
    id: 'first_review',
    title: 'First Drop',
    description: 'Posted your first review',
    icon: '🎯',
    requirement: 1,
    type: 'review_count',
    color: '#F97316',
  },
  {
    id: 'five_reviews',
    title: 'Getting Regular',
    description: 'Posted 5 reviews',
    icon: '🌟',
    requirement: 5,
    type: 'review_count',
    color: '#10B981',
  },
  {
    id: 'ten_reviews',
    title: 'Throne Expert',
    description: 'Posted 10 reviews',
    icon: '🏆',
    requirement: 10,
    type: 'review_count',
    color: '#8B5CF6',
  },
  {
    id: 'photo_reviewer',
    title: 'Picture Perfect',
    description: 'Added a photo to a review',
    icon: '📸',
    requirement: 1,
    type: 'photo_count',
    color: '#EC4899',
  },
];

const calculateBadges = (reviews) => {
  const earnedBadges = [];
  const reviewCount = reviews.length;

  BADGE_DEFINITIONS
    .filter(b => b.type === 'review_count' && reviewCount >= b.requirement)
    .forEach(badge => earnedBadges.push({ ...badge, earned: true }));

  const hasPhotoReview = reviews.some(r => r.photos?.length > 0);
  if (hasPhotoReview) {
    const photoBadge = BADGE_DEFINITIONS.find(b => b.id === 'photo_reviewer');
    if (photoBadge) {
      earnedBadges.push({ ...photoBadge, earned: true });
    }
  }

  return earnedBadges;
};

const getAppVersion = () => {
  const version = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';
  return `${version} (${buildNumber})`;
};

// Profile Card Component
const ProfileCard = ({ stats }) => (
  <View style={styles.profileCard}>
    <View style={styles.profileTop}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={48} color="#6B7280" />
        </View>
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={16} color="#FFFFFF" />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.restroomsAdded}</Text>
          <Text style={styles.statLabel}>Added</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.reviewCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.favoritesCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>
    </View>

    {/* User info */}
    <View style={styles.profileInfo}>
      <Text style={styles.userName}>Anonymous User</Text>
      <Text style={styles.userLocation}>Rock Hill, SC</Text>
      <Text style={styles.userSince}>
        Member since {new Date().getFullYear()}
      </Text>
    </View>
  </View>
);

// Latest Badge Component
const LatestBadgeSection = ({ badge, onViewAll }) => {
  if (!badge) return null;

  return (
    <View style={styles.badgeSection}>
      <Text style={styles.sectionTitle}>Latest Achievement</Text>
      <TouchableOpacity style={styles.latestBadgeCard} onPress={onViewAll} activeOpacity={0.7}>
        <View style={[styles.badgeCircle, { borderColor: badge.color }]}>
          <Text style={styles.badgeIcon}>{badge.icon}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeTitle}>{badge.title}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, subtitle, onPress, showDivider = true }) => (
  <TouchableOpacity style={[styles.menuItem, !showDivider && styles.menuItemNoBorder]} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuIconContainer}>
        <MaterialIcons name={icon} size={24} color="#6B7280" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
  </TouchableOpacity>
);

// Settings Menu Component
const SettingsMenu = ({ onShare, appVersion }) => (
  <View style={styles.settingsSection}>
    {/* Account Settings Group */}
    <View style={styles.menuGroup}>
      <MenuItem
        icon="settings"
        label="Settings"
        onPress={() => Alert.alert('Coming Soon', 'Settings will be available after authentication is added.')}
      />
      <MenuItem
        icon="notifications-none"
        label="Notifications"
        onPress={() => Alert.alert('Coming Soon', 'Notification preferences coming soon.')}
      />
      <MenuItem
        icon="help-outline"
        label="Help & Support"
        onPress={() => Alert.alert('Help', 'Contact us at support@callofdoody.app')}
        showDivider={false}
      />
    </View>

    {/* Sharing Group */}
    <View style={styles.menuGroup}>
      <MenuItem
        icon="share"
        label="Share with Friends"
        subtitle="Help others find relief!"
        onPress={onShare}
        showDivider={false}
      />
    </View>

    {/* Legal Group */}
    <View style={styles.menuGroup}>
      <MenuItem
        icon="privacy-tip"
        label="Privacy Policy"
        onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon.')}
      />
      <MenuItem
        icon="description"
        label="Terms of Service"
        onPress={() => Alert.alert('Terms', 'Terms of service coming soon.')}
        showDivider={false}
      />
    </View>

    {/* App Version */}
    <View style={styles.versionContainer}>
      <Text style={styles.versionText}>
        Version {appVersion}
      </Text>
      <Text style={styles.madeWithLove}>
        Made with 💩 in Rock Hill, SC
      </Text>
    </View>
  </View>
);

export default function ProfileScreen({ navigation }) {
  const [stats, setStats] = useState({
    reviewCount: 0,
    favoritesCount: 0,
    restroomsAdded: 0,
  });
  const [latestBadge, setLatestBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);

      let reviewsData = [];
      let restroomsAddedCount = 0;

      // Get reviews and restrooms added from Firebase
      if (isConfigured && db) {
        try {
          // Get reviews count
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('userId', '==', 'anonymous')
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          reviewsSnapshot.forEach(doc => reviewsData.push({ id: doc.id, ...doc.data() }));

          // Get restrooms added count
          const restroomsQuery = query(
            collection(db, 'pending_restrooms'),
            where('userId', '==', 'anonymous')
          );
          const restroomsSnapshot = await getDocs(restroomsQuery);
          restroomsAddedCount = restroomsSnapshot.size;

          // Also check approved restrooms
          const approvedQuery = query(
            collection(db, 'restrooms'),
            where('submittedBy', '==', 'anonymous')
          );
          const approvedSnapshot = await getDocs(approvedQuery);
          restroomsAddedCount += approvedSnapshot.size;
        } catch (error) {
          console.log('[ProfileScreen] Firebase query error:', error.message);
        }
      }

      // Get favorites count from AsyncStorage
      let favoritesCount = 0;
      try {
        const favorites = await getFavorites();
        favoritesCount = favorites.length;
      } catch (error) {
        console.log('[ProfileScreen] Error loading favorites:', error.message);
      }

      setStats({
        reviewCount: reviewsData.length,
        favoritesCount,
        restroomsAdded: restroomsAddedCount,
      });

      // Calculate latest badge
      if (reviewsData.length > 0) {
        const badges = calculateBadges(reviewsData);
        if (badges.length > 0) {
          setLatestBadge(badges[badges.length - 1]);
        }
      }

      console.log('[ProfileScreen] Loaded profile data:', {
        reviews: reviewsData.length,
        favorites: favoritesCount,
        added: restroomsAddedCount,
      });

    } catch (error) {
      console.error('[ProfileScreen] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message:
          '🚽 Check out Call of Doody - the best app for finding clean restrooms near you!\n\n' +
          'Never be caught without a bathroom again. Download now! 💩',
        title: 'Call of Doody - Find Clean Restrooms',
      });

      if (result.action === Share.sharedAction) {
        console.log('[ProfileScreen] Shared successfully');
      }
    } catch (error) {
      console.error('[ProfileScreen] Error sharing:', error);
    }
  };

  const handleViewAllBadges = () => {
    navigation.navigate('Reviews');
  };

  const appVersion = getAppVersion();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <ProfileCard stats={stats} />

        {/* Latest Badge */}
        <LatestBadgeSection badge={latestBadge} onViewAll={handleViewAllBadges} />

        {/* Settings Menu */}
        <SettingsMenu onShare={handleShare} appVersion={appVersion} />

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  profileInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  userSince: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Badge Section
  badgeSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  latestBadgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Settings Menu
  settingsSection: {
    marginTop: 24,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemNoBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  madeWithLove: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
