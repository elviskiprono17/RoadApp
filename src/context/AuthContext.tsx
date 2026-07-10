import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

/** Free trial duration in milliseconds (30 days) */
const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Lazy loaders for native social-auth modules ─────────
// These modules crash on import in Expo Go because they need
// a development build. We only load them when the user taps
// the social button, and show a friendly error if unavailable.

function getGoogleSignin() {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    const gs = mod.GoogleSignin;
    gs.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
    return gs;
  } catch {
    return null;
  }
}

function getAppleAuth() {
  try {
    const apple = require('expo-apple-authentication');
    const crypto = require('expo-crypto');
    return { apple, crypto };
  } catch {
    return null;
  }
}

export interface Profile {
  id: string;
  display_name: string | null;
  total_goals_created: number;
  account_tier: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  canCreateGoal: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isPremium: false,
  isTrialActive: true,
  trialDaysLeft: 30,
  canCreateGoal: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = profile?.account_tier === 'premium';

  // ─── Trial logic ─────────────────────────────────────────
  const trialInfo = (() => {
    if (!profile) return { isTrialActive: true, trialDaysLeft: 30 };
    const createdAt = new Date(profile.created_at).getTime();
    const now = Date.now();
    const elapsed = now - createdAt;
    const remaining = TRIAL_DURATION_MS - elapsed;
    const daysLeft = Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    return {
      isTrialActive: remaining > 0,
      trialDaysLeft: daysLeft,
    };
  })();

  // User can create goals if they are premium OR still in their free trial
  const canCreateGoal = isPremium || trialInfo.isTrialActive;

  // ─── Load profile ────────────────────────────────────────
  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error.message);
        return;
      }
      setProfile(data as Profile);
    } catch (e) {
      console.error('Profile load exception:', e);
    }
  }

  // ─── Session listener ────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth methods ────────────────────────────────────────
  async function signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { error: error.message };

    // Supabase returns a fake user with empty identities when:
    // - The email is invalid / can't receive mail
    // - The email is already registered (anti-enumeration)
    if (data.user && data.user.identities?.length === 0) {
      return {
        error:
          'Could not create account. Please use a valid email address that can receive mail.',
      };
    }

    return { error: null };
  }

  async function signIn(
    email: string,
    password: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return { error: null };
  }

  // ─── Google Sign-In ──────────────────────────────────────
  async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const GoogleSignin = getGoogleSignin();
      if (!GoogleSignin) {
        return {
          error:
            'Google Sign-In is not available. Please use a development build (not Expo Go).',
        };
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        return { error: 'Failed to get Google ID token.' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : 'Google sign-in failed.';
      return { error: errorMessage };
    }
  }

  // ─── Apple Sign-In ───────────────────────────────────────
  async function signInWithApple(): Promise<{ error: string | null }> {
    try {
      const mods = getAppleAuth();
      if (!mods) {
        return {
          error:
            'Apple Sign-In is not available in this build.',
        };
      }

      const { apple: AppleAuth, crypto: ExpoCrypto } = mods;

      // Generate a secure nonce
      const rawNonce = ExpoCrypto.getRandomValues(new Uint8Array(32))
        .reduce((acc: string, v: number) => acc + v.toString(16).padStart(2, '0'), '');
      const hashedNonce = await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        return { error: 'Failed to get Apple identity token.' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce: rawNonce,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (e: unknown) {
      // User cancelled — not a real error
      if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'ERR_REQUEST_CANCELED') {
        return { error: null };
      }
      const errorMessage =
        e instanceof Error ? e.message : 'Apple sign-in failed.';
      return { error: errorMessage };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isPremium,
        isTrialActive: trialInfo.isTrialActive,
        trialDaysLeft: trialInfo.trialDaysLeft,
        canCreateGoal,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
