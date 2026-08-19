import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import {
  configureRevenueCat,
  identifyUser,
  logOutRevenueCat,
  getCurrentOffering,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  hasPremiumEntitlement,
  getCustomerInfo,
  getPurchasesInstance,
  ENTITLEMENT_ID,
} from '@/lib/revenuecat';
import type {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';

// ─── Context shape ───────────────────────────────────────────
interface SubscriptionContextType {
  /** Whether the user has an active premium subscription via RevenueCat */
  isPremium: boolean;
  /** Whether RevenueCat data is still loading */
  isSubLoading: boolean;
  /** The current offering (monthly + yearly packages) */
  offerings: PurchasesOffering | null;
  /** Purchase a specific package; returns true on success */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases; returns true if premium was restored */
  restorePurchases: () => Promise<boolean>;
  /** Combined: user can create goals if premium OR still in trial */
  canCreateGoal: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isSubLoading: true,
  offerings: null,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  canCreateGoal: true,
});

// ─── Provider ────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isTrialActive, refreshProfile } = useAuth();

  const [isPremium, setIsPremium] = useState(false);
  const [isSubLoading, setIsSubLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  // User can create goals if they have an active subscription OR an active trial
  const canCreateGoal = isPremium || isTrialActive;

  // ── Helper: update premium state from CustomerInfo ─────────
  const updatePremiumState = useCallback((info: CustomerInfo) => {
    setIsPremium(hasPremiumEntitlement(info));
  }, []);

  // ── Sync premium status to Supabase profile ────────────────
  const syncToSupabase = useCallback(
    async (premium: boolean) => {
      if (!user) return;
      try {
        await supabase
          .from('profiles')
          .update({
            account_tier: premium ? 'premium' : 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        await refreshProfile();
      } catch (e) {
        console.error('[SubscriptionProvider] Supabase sync error:', e);
      }
    },
    [user, refreshProfile],
  );

  // ── Initialise RevenueCat + identify user ──────────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsSubLoading(false);
      return;
    }

    // Configure once (safe to call multiple times — it no-ops internally)
    configureRevenueCat();

    async function init() {
      try {
        if (user) {
          // Identify the user so purchases are linked to their account
          const info = await identifyUser(user.id);
          if (info) {
            updatePremiumState(info);
          }
        }

        // Load offerings (available packages)
        const offering = await getCurrentOffering();
        setOfferings(offering);
      } catch (e) {
        console.error('[SubscriptionProvider] Init error:', e);
      } finally {
        setIsSubLoading(false);
      }
    }

    init();

    // When user signs out, reset RevenueCat
    if (!user) {
      logOutRevenueCat().catch((e) =>
        console.error('[SubscriptionProvider] Logout error:', e),
      );
      setIsPremium(false);
      setIsSubLoading(false);
    }
  }, [user?.id]);

  // ── Listen for real-time subscription changes ──────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const Purchases = getPurchasesInstance();
    if (!Purchases) return; // Native module not available — skip listener

    const listener = (info: CustomerInfo) => {
      const premium = hasPremiumEntitlement(info);
      setIsPremium(premium);
      // Keep Supabase in sync whenever RC status changes
      syncToSupabase(premium);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(listener);
    } catch (e) {
      console.warn('[SubscriptionProvider] Could not add listener:', e);
    }

    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [syncToSupabase]);

  // ── Purchase a package ─────────────────────────────────────
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        const info = await rcPurchasePackage(pkg);
        if (!info) return false; // User cancelled or module unavailable

        const premium = hasPremiumEntitlement(info);
        setIsPremium(premium);
        if (premium) {
          await syncToSupabase(true);
        }
        return premium;
      } catch (e) {
        console.error('[SubscriptionProvider] Purchase error:', e);
        return false;
      }
    },
    [syncToSupabase],
  );

  // ── Restore purchases ─────────────────────────────────────
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await rcRestorePurchases();
      if (!info) return false; // Module unavailable

      const premium = hasPremiumEntitlement(info);
      setIsPremium(premium);
      if (premium) {
        await syncToSupabase(true);
      }
      return premium;
    } catch (e) {
      console.error('[SubscriptionProvider] Restore error:', e);
      return false;
    }
  }, [syncToSupabase]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isSubLoading,
        offerings,
        purchasePackage,
        restorePurchases,
        canCreateGoal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
