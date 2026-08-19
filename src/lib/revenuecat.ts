import { Platform } from 'react-native';

// ─── Lazy-load RevenueCat to prevent crash if native module is missing ──
// This mirrors the safe pattern used for Google Sign-In in AuthContext.
function getPurchases() {
  try {
    return require('react-native-purchases').default;
  } catch {
    console.warn('[RevenueCat] Native module not available.');
    return null;
  }
}

function getPurchasesTypes() {
  try {
    return require('react-native-purchases');
  } catch {
    return null;
  }
}

// Re-export types that screens need (type-only imports are safe)
export type {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';

// Pull LOG_LEVEL at runtime only when needed
function getLogLevel() {
  try {
    const mod = require('react-native-purchases');
    return mod.LOG_LEVEL;
  } catch {
    return null;
  }
}

// ─── API Keys ────────────────────────────────────────────────
// Android-only for now; Apple key will be added later.
const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_API_KEY ?? '',
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY ?? '',
};

/** The entitlement identifier configured in the RevenueCat dashboard */
export const ENTITLEMENT_ID = 'premium';

// ─── Initialise SDK ──────────────────────────────────────────
let _isConfigured = false;

/**
 * Configure RevenueCat. Must be called **once** early in the app
 * lifecycle (before any other Purchases call).
 */
export function configureRevenueCat() {
  if (_isConfigured) return;

  const Purchases = getPurchases();
  if (!Purchases) return;

  const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

  if (!apiKey) {
    console.warn(
      `[RevenueCat] No API key for ${Platform.OS}. Purchases will not work.`,
    );
    return;
  }

  if (__DEV__) {
    const LOG_LEVEL = getLogLevel();
    if (LOG_LEVEL) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
  }

  Purchases.configure({ apiKey });
  _isConfigured = true;
}

// ─── Identify / logout ──────────────────────────────────────
/**
 * Link a RevenueCat customer to your own user ID (Supabase uid).
 * This lets purchases sync across devices for the same account.
 */
export async function identifyUser(userId: string): Promise<any> {
  const Purchases = getPurchases();
  if (!Purchases) return null;

  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

/** Log out the current RevenueCat user (e.g. on sign-out). */
export async function logOutRevenueCat(): Promise<void> {
  const Purchases = getPurchases();
  if (!Purchases) return;

  const isAnonymous = await Purchases.isAnonymous();
  if (!isAnonymous) {
    await Purchases.logOut();
  }
}

// ─── Offerings ──────────────────────────────────────────────
/**
 * Fetch the current offerings (product packages) from RevenueCat.
 * Returns the "current" offering, or null if nothing is configured yet.
 */
export async function getCurrentOffering(): Promise<any | null> {
  const Purchases = getPurchases();
  if (!Purchases) return null;

  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

// ─── Purchase ───────────────────────────────────────────────
/**
 * Purchase a specific package (monthly / yearly).
 * Returns the updated CustomerInfo on success, or null if the user cancelled.
 */
export async function purchasePackage(
  pkg: any,
): Promise<any | null> {
  const Purchases = getPurchases();
  if (!Purchases) return null;

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (e.userCancelled) {
      // User tapped "Cancel" — not an error.
      return null;
    }
    throw e;
  }
}

// ─── Restore ────────────────────────────────────────────────
/**
 * Restore previously purchased subscriptions.
 * Returns CustomerInfo so the caller can check entitlements.
 */
export async function restorePurchases(): Promise<any | null> {
  const Purchases = getPurchases();
  if (!Purchases) return null;

  return Purchases.restorePurchases();
}

// ─── Subscription status helpers ────────────────────────────
/**
 * Check whether the given CustomerInfo has an active "premium" entitlement.
 */
export function hasPremiumEntitlement(info: any): boolean {
  if (!info) return false;
  return info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
}

/**
 * Fetch the latest CustomerInfo from RevenueCat.
 */
export async function getCustomerInfo(): Promise<any | null> {
  const Purchases = getPurchases();
  if (!Purchases) return null;

  return Purchases.getCustomerInfo();
}

/**
 * Safely get a listener-compatible Purchases instance.
 * Returns null if the native module is not available.
 */
export function getPurchasesInstance() {
  return getPurchases();
}
