import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { mockRestrooms } from '../data/mockData';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to show nearby restrooms');
        // Default to NYC if permission denied
        setLocation({
          latitude: 40.7580,
          longitude: -73.9855,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      // Default to NYC if error
      setLocation({
        latitude: 40.7580,
        longitude: -73.9855,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLoading(false);
    }
  };

  const onMarkerPress = (restroom) => {
    navigation.navigate('RestroomDetail', { restroom });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mockRestrooms.map((restroom) => (
          <Marker
            key={restroom.id}
            coordinate={{
              latitude: restroom.latitude,
              longitude: restroom.longitude,
            }}
            title={restroom.name}
            description={`Rating: ${restroom.rating} ⭐ | ${restroom.reviews} reviews`}
            onCalloutPress={() => onMarkerPress(restroom)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerText}>🚽</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>🚽 = Public Restroom</Text>
        <Text style={styles.legendSubtext}>Tap a marker for details</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  markerContainer: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  markerText: {
    fontSize: 24,
  },
  legendContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  legendSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
