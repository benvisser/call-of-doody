import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const FEATURE_MESSAGES = {
  favorites: {
    emoji: '❤️',
    title: 'Save your favorites',
    subtitle: 'Log in to save restrooms and access them anywhere',
  },
  reviews: {
    emoji: '⭐',
    title: 'Track your reviews',
    subtitle: 'Log in to see all your reviews and earn badges',
  },
  add: {
    emoji: '📍',
    title: 'Add a restroom',
    subtitle: 'Log in to contribute new locations and help others',
  },
  profile: {
    emoji: '👤',
    title: 'View your profile',
    subtitle: 'Log in to see your stats, badges, and contributions',
  },
};

export default function LoginPrompt({ feature = 'profile', onLogin, onSkip, showSkip = true }) {
  const message = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.profile;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{message.emoji}</Text>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.subtitle}>{message.subtitle}</Text>

        <TouchableOpacity style={styles.loginButton} onPress={onLogin} activeOpacity={0.8}>
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {showSkip && onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>
              Continue without logging in
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: Colors.coral,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
