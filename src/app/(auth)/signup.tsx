import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  // ─── Animated entrance ──────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Sign up handler ───────────────────────────────────
  async function handleSignUp() {
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error);
      return;
    }

    Alert.alert(
      'Check Your Email',
      'We sent a confirmation link to your email. Please verify your account before logging in.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/login' as Href),
        },
      ],
    );
  }

  // ─── Social sign-in handlers ────────────────────────────
  async function handleGoogleSignIn() {
    setSocialLoading('google');
    const { error } = await signInWithGoogle();
    setSocialLoading(null);

    if (error) {
      Alert.alert('Google Sign-In Failed', error);
      return;
    }

    router.replace('/(onboarding)/questions' as Href);
  }

  async function handleAppleSignIn() {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);

    if (error) {
      Alert.alert('Apple Sign-In Failed', error);
      return;
    }

    router.replace('/(onboarding)/questions' as Href);
  }

  const isAnyLoading = loading || socialLoading !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* ── Brand ── */}
            <View style={styles.brandSection}>
              <Text style={styles.roadEmoji}>🛣️</Text>
              <Text style={styles.appName}>RoadApp</Text>
              <Text style={styles.tagline}>Start your journey today</Text>
            </View>

            {/* ── Social buttons first (faster onboarding) ── */}
            <View style={styles.socialSection}>
              <TouchableOpacity
                style={[styles.socialButton, isAnyLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={isAnyLoading}
                activeOpacity={0.8}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.socialIcon}>G</Text>
                    <Text style={styles.socialText}>Sign up with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton, styles.appleButtonDisabled]}
                disabled={true}
                activeOpacity={1}
              >
                <Text style={styles.socialIcon}></Text>
                <Text style={[styles.socialText, styles.dimmedText]}>Sign up with Apple</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Form ── */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create Account</Text>

              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.signUpButton, isAnyLoading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={isAnyLoading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a2e" size="small" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Footer link ── */}
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.replace('/login' as Href)}
            >
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.footerAccent}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  roadEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
  },

  // Social section
  socialSection: {
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  appleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  appleButtonDisabled: {
    opacity: 0.35,
  },
  dimmedText: {
    color: 'rgba(255,255,255,0.6)',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Form card
  formCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  signUpButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },

  // Footer
  footerLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  footerAccent: {
    color: '#F5C518',
    fontWeight: '700',
  },
});
