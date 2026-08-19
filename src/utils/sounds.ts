/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/**
 * Feedback utility for RoadApp.
 *
 * Uses expo-haptics for tactile feedback on iOS/Android,
 * the browser's native Audio API for sound on web,
 * and expo-audio for sound on native platforms.
 */

// ─── Haptics ─────────────────────────────────────────────
function getHaptics() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics');
  } catch {
    return null;
  }
}

// ─── Asset requires (static so Metro can resolve them) ───
const MILESTONE_ASSET = require('../../assets/sounds/milestone.mp3');
const HOORAY_ASSET = require('../../assets/sounds/woohoo.mp3');
const COIN_ASSET = require('../../assets/sounds/coin.mp3');

// ─── Web audio (uses browser's native HTMLAudioElement) ───
const webPlayers: Record<string, HTMLAudioElement> = {};

function getAssetUri(assetModule: any): string | null {
  // On web, require() for assets returns a string (the URL) directly
  if (typeof assetModule === 'string') {
    return assetModule;
  }
  // Sometimes it's a number (asset ID) — try resolving via Image
  if (typeof assetModule === 'number') {
    try {
      const { Image } = require('react-native');
      const resolved = Image.resolveAssetSource(assetModule);
      if (resolved?.uri) return resolved.uri;
    } catch {
      // fall through
    }
  }
  // Could be an object with a uri property
  if (assetModule && typeof assetModule === 'object' && assetModule.uri) {
    return assetModule.uri;
  }
  // Could be default export
  if (assetModule && typeof assetModule === 'object' && assetModule.default) {
    return getAssetUri(assetModule.default);
  }
  return null;
}

function playWebAudio(key: string, assetModule: any) {
  if (typeof window === 'undefined') return;

  try {
    if (!webPlayers[key]) {
      const uri = getAssetUri(assetModule);
      console.log(`[Sound] Resolving "${key}":`, typeof assetModule, assetModule, '→', uri);
      if (!uri) {
        console.warn(`[Sound] Could not resolve URI for "${key}"`);
        return;
      }
      webPlayers[key] = new window.Audio(uri);
    }
    const audio = webPlayers[key];
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn(`[Sound] Browser blocked playback for "${key}":`, err);
    });
  } catch (e) {
    console.warn(`[Sound] Error in playWebAudio for "${key}":`, e);
  }
}

// ─── Native audio (uses expo-audio) ──────────────────────
const nativePlayers: Record<string, any> = {};
let audioModeConfigured = false;

function ensureAudioModeConfigured() {
  if (audioModeConfigured || Platform.OS === 'web') return;
  try {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    audioModeConfigured = true;
  } catch {
    // ignore
  }
}

function playNativeAudio(key: string, assetModule: any) {
  if (Platform.OS === 'web') return;

  ensureAudioModeConfigured();
  try {
    if (!nativePlayers[key]) {
      const { createAudioPlayer } = require('expo-audio');
      nativePlayers[key] = createAudioPlayer(assetModule);
    }
    const player = nativePlayers[key];
    if (player) {
      player.seekTo(0);
      player.play();
    }
  } catch (e) {
    console.warn(`[Sound] Failed to play native audio [${key}]:`, e);
  }
}

// ─── Unified play function ───────────────────────────────
function playSound(key: string, assetModule: any) {
  if (Platform.OS === 'web') {
    playWebAudio(key, assetModule);
  } else {
    playNativeAudio(key, assetModule);
  }
}

// ─── Public API ──────────────────────────────────────────

/** Play coin clink sound when coins fly */
export function playCoinSound() {
  playSound('coin', COIN_ASSET);
}

/** Play milestone completed sound and haptics */
export function playMilestoneSound() {
  playSound('milestone', MILESTONE_ASSET);

  try {
    const Haptics = getHaptics();
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // silently fail
  }
}

/** Play goal completed (hooray/confetti) sound and haptics */
export function playGoalCompleteSound() {
  playSound('hooray', HOORAY_ASSET);

  try {
    const Haptics = getHaptics();
    // Heavy impact for the big celebration moment
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Follow up with a success notification after a beat
    setTimeout(() => {
      Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 200);
  } catch {
    // silently fail
  }
}

/** Haptic feedback when progress line animates (value update) */
export function playProgressSound() {
  try {
    const Haptics = getHaptics();
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // silently fail
  }
}
