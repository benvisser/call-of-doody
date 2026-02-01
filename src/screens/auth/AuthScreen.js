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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import {
  PhoneAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Colors } from '../../constants/colors';

const AUTH_MODES = {
  SELECT: 'select',
  PHONE: 'phone',
  EMAIL: 'email',
  VERIFY: 'verify',
};

// Format phone number as user types
const formatPhoneNumber = (text) => {
  const cleaned = text.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const parts = [match[1], match[2], match[3]].filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
    return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  }
  return text;
};

// Extract raw digits from formatted phone
const getRawPhoneNumber = (formatted) => {
  return formatted.replace(/\D/g, '');
};

export default function AuthScreen({ navigation, route }) {
  const { returnTo, feature } = route.params || {};

  const [mode, setMode] = useState(AUTH_MODES.SELECT);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const recaptchaVerifier = useRef(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const codeInputRef = useRef(null);

  // Auto-focus input when mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === AUTH_MODES.PHONE && phoneInputRef.current) {
        phoneInputRef.current.focus();
      } else if (mode === AUTH_MODES.EMAIL && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (mode === AUTH_MODES.VERIFY && codeInputRef.current) {
        codeInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [mode]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handlePhoneSubmit = async () => {
    const rawPhone = getRawPhoneNumber(phoneNumber);
    if (rawPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const fullPhoneNumber = `+1${rawPhone}`;

      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current
      );

      setVerificationId(verificationId);
      setMode(AUTH_MODES.VERIFY);
    } catch (error) {
      console.error('[Auth] Phone verification error:', error);
      let message = 'Unable to send verification code. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format.';
      }
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      // Auth state listener in AuthContext will handle the rest
      navigation.goBack();
    } catch (error) {
      console.error('[Auth] Code verification error:', error);
      let message = 'Invalid verification code. Please try again.';
      if (error.code === 'auth/code-expired') {
        message = 'Code has expired. Please request a new one.';
      }
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.goBack();
    } catch (signInError) {
      if (signInError.code === 'auth/user-not-found') {
        // User doesn't exist, create account
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
          navigation.goBack();
        } catch (createError) {
          console.error('[Auth] Create account error:', createError);
          let message = 'Unable to create account. Please try again.';
          if (createError.code === 'auth/email-already-in-use') {
            message = 'This email is already registered.';
          } else if (createError.code === 'auth/invalid-email') {
            message = 'Please enter a valid email address.';
          }
          Alert.alert('Sign Up Failed', message);
        }
      } else if (signInError.code === 'auth/wrong-password') {
        Alert.alert('Incorrect Password', 'The password is incorrect. Please try again.');
      } else if (signInError.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        console.error('[Auth] Sign in error:', signInError);
        Alert.alert('Sign In Failed', 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    setMode(AUTH_MODES.PHONE);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <MaterialIcons name="close" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {mode === AUTH_MODES.SELECT && 'Log in or sign up'}
        {mode === AUTH_MODES.PHONE && 'Enter your phone number'}
        {mode === AUTH_MODES.EMAIL && 'Continue with email'}
        {mode === AUTH_MODES.VERIFY && 'Enter verification code'}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSelectMode = () => (
    <View style={styles.content}>
      <Text style={styles.welcomeText}>Welcome to Call of Doody</Text>
      <Text style={styles.subtitleText}>
        Sign in to save favorites, write reviews, and add new restrooms
      </Text>

      <TouchableOpacity
        style={styles.authMethodButton}
        onPress={() => setMode(AUTH_MODES.PHONE)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="phone" size={22} color="#111827" style={styles.methodIcon} />
        <Text style={styles.authMethodText}>Continue with phone</Text>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.authMethodButton}
        onPress={() => setMode(AUTH_MODES.EMAIL)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="email" size={22} color="#111827" style={styles.methodIcon} />
        <Text style={styles.authMethodText}>Continue with email</Text>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <Text style={styles.skipButtonText}>Continue without an account</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode(AUTH_MODES.SELECT)}
      >
        <MaterialIcons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Phone number</Text>
      <Text style={styles.inputHint}>
        We'll send you a verification code
      </Text>

      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+1</Text>
        </View>
        <TextInput
          ref={phoneInputRef}
          style={styles.phoneInput}
          value={phoneNumber}
          onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
          placeholder="(555) 555-5555"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={14}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          getRawPhoneNumber(phoneNumber).length !== 10 && styles.continueButtonDisabled
        ]}
        onPress={handlePhoneSubmit}
        disabled={getRawPhoneNumber(phoneNumber).length !== 10 || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmailInput = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode(AUTH_MODES.SELECT)}
      >
        <MaterialIcons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        ref={emailInputRef}
        style={styles.textInput}
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <Text style={[styles.inputLabel, { marginTop: 20 }]}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialIcons
            name={showPassword ? 'visibility-off' : 'visibility'}
            size={22}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.passwordHint}>
        New user? We'll create an account for you
      </Text>

      <TouchableOpacity
        style={[
          styles.continueButton,
          (!email.trim() || !password.trim()) && styles.continueButtonDisabled
        ]}
        onPress={handleEmailSubmit}
        disabled={!email.trim() || !password.trim() || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode(AUTH_MODES.PHONE)}
      >
        <MaterialIcons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Verification code</Text>
      <Text style={styles.inputHint}>
        Enter the 6-digit code sent to {phoneNumber}
      </Text>

      <TextInput
        ref={codeInputRef}
        style={styles.codeInput}
        value={verificationCode}
        onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.continueButton,
          verificationCode.length !== 6 && styles.continueButtonDisabled
        ]}
        onPress={handleVerifyCode}
        disabled={verificationCode.length !== 6 || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={loading}
      >
        <Text style={styles.resendButtonText}>Didn't receive a code? Resend</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth?.app?.options}
        attemptInvisibleVerification={true}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === AUTH_MODES.SELECT && renderSelectMode()}
          {mode === AUTH_MODES.PHONE && renderPhoneInput()}
          {mode === AUTH_MODES.EMAIL && renderEmailInput()}
          {mode === AUTH_MODES.VERIFY && renderVerification()}
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  },

  // Select Mode
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 40,
  },
  authMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  methodIcon: {
    marginRight: 12,
  },
  authMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.coral,
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  // Back Button
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginLeft: -8,
  },

  // Input Labels
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
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

  // Password Input
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  passwordToggle: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  passwordHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
  },

  // Verification Code Input
  codeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },

  // Continue Button
  continueButton: {
    backgroundColor: Colors.coral,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Resend Button
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: Colors.coral,
    fontWeight: '500',
  },
});
