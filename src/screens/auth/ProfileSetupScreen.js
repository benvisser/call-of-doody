import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

// Available avatar options
const AVATARS = [
  { id: 'toilet', emoji: '🚽', label: 'Toilet' },
  { id: 'poop', emoji: '💩', label: 'Poop' },
  { id: 'roll', emoji: '🧻', label: 'Paper Roll' },
  { id: 'plunger', emoji: '🪠', label: 'Plunger' },
  { id: 'soap', emoji: '🧼', label: 'Soap' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
];

// Simple profanity check (basic list - expand as needed)
const BLOCKED_WORDS = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy', 'cunt'];

const containsProfanity = (text) => {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
};

// Validate username
const validateUsername = (username) => {
  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
  }

  if (containsProfanity(trimmed)) {
    return { valid: false, error: 'Please choose an appropriate username' };
  }

  return { valid: true, error: null };
};

// Validate display name
const validateDisplayName = (name) => {
  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: 'Display name is required' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Display name must be 30 characters or less' };
  }

  if (containsProfanity(trimmed)) {
    return { valid: false, error: 'Please choose an appropriate display name' };
  }

  return { valid: true, error: null };
};

export default function ProfileSetupScreen({ navigation }) {
  const { createUserProfile, user } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [loading, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [displayNameError, setDisplayNameError] = useState(null);

  const usernameInputRef = useRef(null);
  const displayNameInputRef = useRef(null);

  useEffect(() => {
    // Focus username input on mount
    const timer = setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUsernameChange = (text) => {
    // Only allow lowercase letters, numbers, and underscores
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);

    if (cleaned.length > 0) {
      const validation = validateUsername(cleaned);
      setUsernameError(validation.error);
    } else {
      setUsernameError(null);
    }
  };

  const handleDisplayNameChange = (text) => {
    setDisplayName(text);

    if (text.trim().length > 0) {
      const validation = validateDisplayName(text);
      setDisplayNameError(validation.error);
    } else {
      setDisplayNameError(null);
    }
  };

  const handleSubmit = async () => {
    const usernameValidation = validateUsername(username);
    const displayNameValidation = validateDisplayName(displayName);

    if (!usernameValidation.valid) {
      setUsernameError(usernameValidation.error);
      return;
    }

    if (!displayNameValidation.valid) {
      setDisplayNameError(displayNameValidation.error);
      return;
    }

    setSaving(true);
    try {
      const avatar = AVATARS.find(a => a.id === selectedAvatar);

      await createUserProfile({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        avatarId: selectedAvatar,
        avatarEmoji: avatar?.emoji || '🚽',
      });

      // Navigate back - the auth state will update and show the profile
      navigation.goBack();
    } catch (error) {
      console.error('[ProfileSetup] Error creating profile:', error);

      let message = 'Unable to create profile. Please try again.';
      if (error.message?.includes('username')) {
        message = 'This username is already taken. Please choose another.';
        setUsernameError(message);
      }

      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      username.trim().length >= 3 &&
      displayName.trim().length >= 1 &&
      !usernameError &&
      !displayNameError
    );
  };

  const selectedAvatarObj = AVATARS.find(a => a.id === selectedAvatar);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Create your profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.selectedAvatarContainer}>
                <Text style={styles.selectedAvatarEmoji}>
                  {selectedAvatarObj?.emoji}
                </Text>
              </View>
              <Text style={styles.avatarLabel}>Choose your avatar</Text>
            </View>

            {/* Avatar Grid */}
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar.id && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setSelectedAvatar(avatar.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Username Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.usernameInputContainer}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  ref={usernameInputRef}
                  style={styles.usernameInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="yourname"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!loading}
                />
              </View>
              {usernameError && (
                <Text style={styles.errorText}>{usernameError}</Text>
              )}
              <Text style={styles.inputHint}>
                Letters, numbers, and underscores only
              </Text>
            </View>

            {/* Display Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Display name</Text>
              <TextInput
                ref={displayNameInputRef}
                style={styles.textInput}
                value={displayName}
                onChangeText={handleDisplayNameChange}
                placeholder="Your Name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                maxLength={30}
                editable={!loading}
              />
              {displayNameError && (
                <Text style={styles.errorText}>{displayNameError}</Text>
              )}
              <Text style={styles.inputHint}>
                This is how your name appears on reviews
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !isFormValid() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  selectedAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.coral,
  },
  selectedAvatarEmoji: {
    fontSize: 48,
  },
  avatarLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Avatar Grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.coral,
    backgroundColor: '#FFF7ED',
  },
  avatarEmoji: {
    fontSize: 28,
  },

  // Input Section
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Username Input
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    paddingLeft: 16,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 4,
    paddingRight: 16,
    fontSize: 16,
    color: '#111827',
  },

  // Text Input
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },

  // Submit Button
  submitButton: {
    backgroundColor: Colors.coral,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
