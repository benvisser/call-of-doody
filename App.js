import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import MapScreen from './src/screens/MapScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Find"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#5D4037',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 34 : 12,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="Find"
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="favorite-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="star-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
