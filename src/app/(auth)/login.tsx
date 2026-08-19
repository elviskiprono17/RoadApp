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
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // ─── Sign in handler ────────────────────────────────────
  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
      return;
    }

    // Route to onboarding if not completed, otherwise home
    if (!profile?.onboarding_completed) {
      router.replace('/(onboarding)/questions' as Href);
    } else {
      router.replace('/' as Href);
    }
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

    // Route to onboarding if not completed, otherwise home
    if (!profile?.onboarding_completed) {
      router.replace('/(onboarding)/questions' as Href);
    } else {
      router.replace('/' as Href);
    }
  }

  async function handleAppleSignIn() {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);

    if (error) {
      Alert.alert('Apple Sign-In Failed', error);
      return;
    }

    // Route to onboarding if not completed, otherwise home
    if (!profile?.onboarding_completed) {
      router.replace('/(onboarding)/questions' as Href);
    } else {
      router.replace('/' as Href);
    }
  }

  const isAnyLoading = loading || socialLoading !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <Text style={styles.tagline}>Track your goals, own your journey</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>

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
              placeholder="Your password"
              placeholderTextColor="rgba(255,255,255,0.25)"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginButton, isAnyLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isAnyLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#1a1a2e" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Social buttons ── */}
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
                  <Text style={styles.socialText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, styles.appleButtonDisabled]}
              disabled={true}
              activeOpacity={1}
            >
              <Text style={styles.socialIcon}></Text>
              <Text style={[styles.socialText, styles.dimmedText]}>Continue with Apple</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Footer link ── */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push('/signup' as Href)}
          >
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerAccent}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 36,
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
    marginBottom: 20,
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
  loginButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
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

  // Social buttons
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
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
