import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import RestroomDetailScreen from './src/screens/RestroomDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Map"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: '🚽 Call of Doody',
          }}
        />
        <Stack.Screen
          name="RestroomDetail"
          component={RestroomDetailScreen}
          options={{
            title: 'Restroom Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
