import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

export const SETTINGS_KEYS = {
  UNITS: '@settings_units',
  MAP_TYPE: '@settings_map_type',
  ANONYMOUS_MODE: '@settings_anonymous',
};

// Reusable Components
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const SettingRow = ({
  icon,
  label,
  subtitle,
  onPress,
  rightComponent,
  showChevron
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress || !!rightComponent}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingLeft}>
      {icon && (
        <View style={styles.settingIconContainer}>
          <MaterialIcons name={icon} size={22} color="#6B7280" />
        </View>
      )}
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>

    {rightComponent || (showChevron && (
      <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
    ))}
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const [units, setUnits] = useState('miles');
  const [mapType, setMapType] = useState('standard');
  const [anonymousMode, setAnonymousMode] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUnits = await AsyncStorage.getItem(SETTINGS_KEYS.UNITS);
      const savedMapType = await AsyncStorage.getItem(SETTINGS_KEYS.MAP_TYPE);
      const savedAnonymous = await AsyncStorage.getItem(SETTINGS_KEYS.ANONYMOUS_MODE);

      if (savedUnits) setUnits(savedUnits);
      if (savedMapType) setMapType(savedMapType);
      if (savedAnonymous !== null) setAnonymousMode(savedAnonymous === 'true');
    } catch (error) {
      console.error('[Settings] Error loading settings:', error);
    }
  };

  const saveUnits = async (newUnits) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.UNITS, newUnits);
      setUnits(newUnits);
    } catch (error) {
      console.error('[Settings] Error saving units:', error);
    }
  };

  const saveMapType = async (newType) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.MAP_TYPE, newType);
      setMapType(newType);
    } catch (error) {
      console.error('[Settings] Error saving map type:', error);
    }
  };

  const saveAnonymousMode = async (value) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEYS.ANONYMOUS_MODE, value.toString());
      setAnonymousMode(value);
    } catch (error) {
      console.error('[Settings] Error saving anonymous mode:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary data. Your reviews and favorites will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map Preferences */}
        <SectionHeader title="Map Preferences" />

        <SettingRow
          label="Distance Units"
          rightComponent={
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  units === 'miles' && styles.segmentButtonActive
                ]}
                onPress={() => saveUnits('miles')}
              >
                <Text style={[
                  styles.segmentText,
                  units === 'miles' && styles.segmentTextActive
                ]}>
                  Miles
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  units === 'kilometers' && styles.segmentButtonActive
                ]}
                onPress={() => saveUnits('kilometers')}
              >
                <Text style={[
                  styles.segmentText,
                  units === 'kilometers' && styles.segmentTextActive
                ]}>
                  Km
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        <SettingRow
          label="Map Type"
          rightComponent={
            <View style={styles.mapTypeContainer}>
              {['Standard', 'Satellite', 'Hybrid'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mapTypeButton,
                    mapType === type.toLowerCase() && styles.mapTypeButtonActive
                  ]}
                  onPress={() => saveMapType(type.toLowerCase())}
                >
                  <Text style={[
                    styles.mapTypeText,
                    mapType === type.toLowerCase() && styles.mapTypeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          }
        />

        {/* Privacy */}
        <SectionHeader title="Privacy" />

        <SettingRow
          label="Anonymous Mode"
          subtitle="Post reviews without showing your name"
          rightComponent={
            <Switch
              value={anonymousMode}
              onValueChange={saveAnonymousMode}
              trackColor={{ false: '#D1D5DB', true: '#FED7AA' }}
              thumbColor={anonymousMode ? Colors.coral : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          }
        />

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />

        <SettingRow
          icon="delete-outline"
          label="Clear Cache"
          subtitle="Free up storage space"
          onPress={handleClearCache}
          showChevron
        />

        {/* About */}
        <SectionHeader title="About" />

        <SettingRow
          icon="privacy-tip"
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon')}
          showChevron
        />

        <SettingRow
          icon="description"
          label="Terms of Service"
          onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
          showChevron
        />

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

  // Header
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Setting Row
  settingRow: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Segmented Control (Units)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: Colors.coral,
    fontWeight: '600',
  },

  // Map Type Selector
  mapTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mapTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  mapTypeButtonActive: {
    borderColor: Colors.coral,
    backgroundColor: '#FFF7ED',
  },
  mapTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  mapTypeTextActive: {
    color: Colors.coral,
    fontWeight: '600',
  },
});
