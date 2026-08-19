import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Dimensions,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { requestNotificationPermissions, scheduleReminders } from '@/utils/notifications';
import type { PurchasesPackage } from '@/lib/revenuecat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Plan = 'monthly' | 'yearly';

interface OnboardingAnswers {
  goalFocus: string;
  trackingPreference: string;
  biggestChallenge: string;
  reminderFrequency: string;
}

export default function TrialScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const { offerings, purchasePackage } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [trialLoading, setTrialLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);

  // ─── Resolve packages from RevenueCat offerings ───────────
  const monthlyPackage: PurchasesPackage | undefined =
    offerings?.availablePackages?.find((p) => p.packageType === 'MONTHLY');
  const yearlyPackage: PurchasesPackage | undefined =
    offerings?.availablePackages?.find((p) => p.packageType === 'ANNUAL');

  // Use real store prices if available, fallback to defaults
  const monthlyPrice = monthlyPackage?.product?.priceString ?? '$2.99';
  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$35.88';

  // ─── Disable Android hardware back button ─────────────────
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // ─── Load onboarding answers from AsyncStorage ────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('onboarding_answers');
        if (raw) {
          setAnswers(JSON.parse(raw) as OnboardingAnswers);
        }
      } catch (e) {
        console.error('Failed to load onboarding answers:', e);
      }
    })();
  }, []);

  // ─── Animated entrance ────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const trialCardAnim = useRef(new Animated.Value(0)).current;
  const dividerAnim = useRef(new Animated.Value(0)).current;
  const planCard1Anim = useRef(new Animated.Value(0)).current;
  const planCard2Anim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Fade + slide the whole screen in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 2. Pop the celebration emoji
      Animated.spring(emojiScale, {
        toValue: 1,
        tension: 50,
        friction: 4,
        useNativeDriver: true,
      }),
      // 3. Reveal the trial card
      Animated.spring(trialCardAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      // 4. Divider fade
      Animated.timing(dividerAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 5. Stagger plan cards
      Animated.stagger(100, [
        Animated.spring(planCard1Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(planCard2Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // 6. Features list
      Animated.spring(featuresAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Start Free Trial handler (Supabase-based, unchanged) ─
  async function handleStartTrial() {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to start your trial.');
      return;
    }
    if (!answers) {
      Alert.alert('Error', 'Onboarding answers not found. Please try again.');
      return;
    }

    setTrialLoading(true);

    try {
      await completeOnboarding(answers);

      // Request notification permissions and schedule reminders
      await requestNotificationPermissions();
      await scheduleReminders(answers.reminderFrequency);

      router.replace('/' as Href);
    } catch (_e) {
      setTrialLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }

  // ─── Subscribe handler (RevenueCat) ───────────────────────
  async function handleSubscribe() {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to subscribe.');
      return;
    }
    if (!answers) {
      Alert.alert('Error', 'Onboarding answers not found. Please try again.');
      return;
    }

    const pkg = selectedPlan === 'monthly' ? monthlyPackage : yearlyPackage;
    if (!pkg) {
      Alert.alert('Not Available', 'This subscription is not available yet. Please try again later.');
      return;
    }

    setSubscribeLoading(true);

    try {
      const success = await purchasePackage(pkg);

      if (success) {
        // Complete onboarding (saves answers + marks done in Supabase)
        await completeOnboarding(answers);

        // Request notification permissions and schedule reminders
        await requestNotificationPermissions();
        await scheduleReminders(answers.reminderFrequency);

        // Navigate to home
        router.replace('/' as Href);
      } else {
        // User cancelled — do nothing
        setSubscribeLoading(false);
      }
    } catch (e: any) {
      setSubscribeLoading(false);
      Alert.alert('Purchase Error', e.message ?? 'Something went wrong. Please try again.');
    }
  }

  const isAnyLoading = trialLoading || subscribeLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
          {/* ── Celebration Section ── */}
          <Animated.View
            style={[
              styles.emojiWrapper,
              { transform: [{ scale: emojiScale }] },
            ]}
          >
            <View style={styles.emojiGlow} />
            <Text style={styles.emojiText}>🎉</Text>
          </Animated.View>

          <Text style={styles.headerTitle}>You're all set!</Text>
          <Text style={styles.headerSubtitle}>
            Start your journey with a free trial
          </Text>

          {/* ── Trial Card (Primary) ── */}
          <Animated.View
            style={[
              styles.trialCardWrapper,
              {
                opacity: trialCardAnim,
                transform: [
                  {
                    scale: trialCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.trialCard}>
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>RECOMMENDED</Text>
              </View>

              <Text style={styles.trialHeading}>14 Days Free</Text>
              <Text style={styles.trialDetail}>Full access to all features</Text>
              <Text style={styles.trialDetail}>No payment required</Text>

              <TouchableOpacity
                style={[styles.trialButton, isAnyLoading && styles.buttonDisabled]}
                onPress={handleStartTrial}
                disabled={isAnyLoading}
                activeOpacity={0.85}
              >
                {trialLoading ? (
                  <ActivityIndicator color="#1a1a2e" size="small" />
                ) : (
                  <Text style={styles.trialButtonText}>Start Free Trial</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── 'or' Divider ── */}
          <Animated.View style={[styles.dividerRow, { opacity: dividerAnim }]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* ── Premium Subscription Section ── */}
          <Text style={styles.premiumSectionTitle}>Subscribe to Premium</Text>

          <View style={styles.cardsRow}>
            {/* Monthly */}
            <Animated.View
              style={{
                flex: 1,
                opacity: planCard1Anim,
                transform: [
                  {
                    scale: planCard1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
              >
                {selectedPlan === 'monthly' && <View style={styles.selectedDot} />}
                <Text
                  style={[
                    styles.planLabel,
                    selectedPlan === 'monthly' && styles.planLabelSelected,
                  ]}
                >
                  Monthly
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    selectedPlan === 'monthly' && styles.planPriceSelected,
                  ]}
                >
                  {monthlyPrice}
                </Text>
                <Text style={styles.planPeriod}>per month</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Yearly */}
            <Animated.View
              style={{
                flex: 1,
                opacity: planCard2Anim,
                transform: [
                  {
                    scale: planCard2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.8}
              >
                {selectedPlan === 'yearly' && <View style={styles.selectedDot} />}
                <Text
                  style={[
                    styles.planLabel,
                    selectedPlan === 'yearly' && styles.planLabelSelected,
                  ]}
                >
                  Yearly
                </Text>
                <Text
                  style={[
                    styles.planPrice,
                    selectedPlan === 'yearly' && styles.planPriceSelected,
                  ]}
                >
                  {yearlyPrice}
                </Text>
                <Text style={styles.planPeriod}>per year</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── Subscribe Button (Outlined) ── */}
          <TouchableOpacity
            style={[styles.subscribeButton, isAnyLoading && styles.buttonDisabled]}
            onPress={handleSubscribe}
            disabled={isAnyLoading}
            activeOpacity={0.85}
          >
            {subscribeLoading ? (
              <ActivityIndicator color="#F5C518" size="small" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Subscribe Now — {selectedPlan === 'monthly' ? monthlyPrice + '/mo' : yearlyPrice + '/yr'}
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Features List ── */}
          <Animated.View
            style={[
              styles.featuresCard,
              {
                opacity: featuresAnim,
                transform: [
                  {
                    translateY: featuresAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureRow}>
              <View style={styles.featureCheckCircle}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <Text style={styles.featureText}>Unlimited goal creation</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureRow}>
              <View style={styles.featureCheckCircle}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <Text style={styles.featureText}>Full roadmap history & archive</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureRow}>
              <View style={styles.featureCheckCircle}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <Text style={styles.featureText}>Priority support & new features</Text>
            </View>
          </Animated.View>

          {/* Bottom spacer for scroll safety */}
          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
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
    paddingVertical: 16,
  },

  // Celebration emoji
  emojiWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(245,197,24,0.12)',
    top: -10,
  },
  emojiText: {
    fontSize: 64,
  },

  // Header
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 12,
    marginBottom: 28,
  },

  // Trial card (primary)
  trialCardWrapper: {
    marginBottom: 20,
  },
  trialCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F5C518',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  trialBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#F5C518',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 1.2,
  },
  trialHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 10,
  },
  trialDetail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 4,
  },
  trialButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 18,
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
    paddingHorizontal: 16,
  },

  // Premium section title
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Plan cards (matches paywall.tsx)
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  planCardSelected: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.05)',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  selectedDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5C518',
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  planLabelSelected: {
    color: 'rgba(245,197,24,0.8)',
  },
  planPrice: {
    fontSize: 30,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
  },
  planPriceSelected: {
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Subscribe button (outlined)
  subscribeButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5C518',
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5C518',
    letterSpacing: 0.3,
  },

  // Shared disabled
  buttonDisabled: {
    opacity: 0.6,
  },

  // Features
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  featureCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(27,138,74,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B8A4A',
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    flex: 1,
  },
  featureDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 10,
    marginLeft: 36,
  },
});
