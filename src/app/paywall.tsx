import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/context/SubscriptionContext';
import type { PurchasesPackage } from '@/lib/revenuecat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Plan = 'monthly' | 'yearly';

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, purchasePackage, restorePurchases } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // ─── Resolve packages from RevenueCat offerings ───────────
  const monthlyPackage: PurchasesPackage | undefined =
    offerings?.availablePackages?.find((p) => p.packageType === 'MONTHLY');
  const yearlyPackage: PurchasesPackage | undefined =
    offerings?.availablePackages?.find((p) => p.packageType === 'ANNUAL');

  // Use real store prices if available, fallback to defaults
  const monthlyPrice = monthlyPackage?.product?.priceString ?? '$2.99';
  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$35.88';

  // ─── Animated entrance ──────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const crownScale = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
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
      Animated.spring(crownScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.stagger(120, [
        Animated.spring(card1Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(btnAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Subscribe handler (RevenueCat) ─────────────────────
  async function handleSubscribe() {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : yearlyPackage;
    if (!pkg) {
      Alert.alert('Not Available', 'This subscription is not available yet. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Alert.alert(
          '🎉 Welcome to Premium!',
          'You now have unlimited access to all RoadApp features.',
          [{ text: "Let's Go", onPress: () => router.back() }],
        );
      }
    } catch (e: any) {
      Alert.alert('Purchase Error', e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Restore handler (RevenueCat) ───────────────────────
  async function handleRestore() {
    setRestoreLoading(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          '✅ Restored!',
          'Your premium access has been restored.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any previous subscriptions for this account.',
        );
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message ?? 'Something went wrong.');
    } finally {
      setRestoreLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Back button ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* ── Crown animation ── */}
        <Animated.View
          style={[
            styles.crownWrapper,
            { transform: [{ scale: crownScale }] },
          ]}
        >
          <View style={styles.crownGlow} />
          <Text style={styles.crownEmoji}>👑</Text>
        </Animated.View>

        {/* ── Header ── */}
        <Text style={styles.headerTitle}>Go Premium</Text>
        <Text style={styles.headerSubtitle}>
          Your free trial has ended. Upgrade to keep creating goals and stay on track.
        </Text>

        {/* ── Pricing cards ── */}
        <View style={styles.cardsRow}>
          {/* Monthly */}
          <Animated.View style={{ flex: 1, opacity: card1Anim, transform: [{ scale: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              {selectedPlan === 'monthly' && (
                <View style={styles.selectedDot} />
              )}
              <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelSelected]}>Monthly</Text>
              <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>{monthlyPrice}</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Yearly */}
          <Animated.View style={{ flex: 1, opacity: card2Anim, transform: [{ scale: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              {selectedPlan === 'yearly' && (
                <View style={styles.selectedDot} />
              )}
              <Text style={[styles.planLabel, selectedPlan === 'yearly' && styles.planLabelSelected]}>Yearly</Text>
              <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceSelected]}>{yearlyPrice}</Text>
              <Text style={styles.planPeriod}>per year</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Features list ── */}
        <View style={styles.featuresCard}>
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
        </View>

        {/* ── Subscribe button ── */}
        <Animated.View style={{ opacity: btnAnim, transform: [{ scale: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={loading || restoreLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1a1a2e" size="small" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Subscribe — {selectedPlan === 'monthly' ? monthlyPrice + '/mo' : yearlyPrice + '/yr'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Restore ── */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading || restoreLoading}
          activeOpacity={0.6}
        >
          {restoreLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.35)" size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchase</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // Back
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '600',
  },

  // Crown
  crownWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  crownGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,197,24,0.12)',
    top: -8,
  },
  crownEmoji: {
    fontSize: 56,
  },

  // Header
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 32,
  },

  // Plan cards
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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

  // Features
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
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

  // Subscribe
  subscribeButton: {
    backgroundColor: '#F5C518',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.3,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
});
