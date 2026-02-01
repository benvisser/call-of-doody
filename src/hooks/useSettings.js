import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SETTINGS_KEYS = {
  UNITS: '@settings_units',
  MAP_TYPE: '@settings_map_type',
  ANONYMOUS_MODE: '@settings_anonymous',
};

export const useSettings = () => {
  const [settings, setSettings] = useState({
    units: 'miles',
    mapType: 'standard',
    anonymousMode: true,
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const units = await AsyncStorage.getItem(SETTINGS_KEYS.UNITS) || 'miles';
      const mapType = await AsyncStorage.getItem(SETTINGS_KEYS.MAP_TYPE) || 'standard';
      const anonymousMode = await AsyncStorage.getItem(SETTINGS_KEYS.ANONYMOUS_MODE);

      setSettings({
        units,
        mapType,
        anonymousMode: anonymousMode === null ? true : anonymousMode === 'true',
      });
    } catch (error) {
      console.error('[useSettings] Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Helper function to format distance based on units setting
  const formatDistance = useCallback((distanceInMiles) => {
    if (settings.units === 'kilometers') {
      const km = distanceInMiles * 1.60934;
      if (km < 1) {
        return `${Math.round(km * 1000)} m`;
      }
      return `${km.toFixed(1)} km`;
    }
    if (distanceInMiles < 0.1) {
      const feet = Math.round(distanceInMiles * 5280);
      return `${feet} ft`;
    }
    return `${distanceInMiles.toFixed(1)} mi`;
  }, [settings.units]);

  // Refresh settings (useful when returning from Settings screen)
  const refresh = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    ...settings,
    loading,
    refresh,
    formatDistance,
  };
};
