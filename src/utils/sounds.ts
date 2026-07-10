/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform, Image } from 'react-native';

/**
 * Feedback utility for RoadApp.
 *
 * Uses expo-haptics for tactile feedback on iOS/Android,
 * and expo-audio for sound playback.
 */

// Lazy-load haptics to avoid crashes if native module isn't available
function getHaptics() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics');
  } catch {
    return null;
  }
}

// Lazy-loaded audio players
let milestonePlayer: any = null;
let hoorayPlayer: any = null;
let coinPlayer: any = null;
let audioModeConfigured = false;

function ensureAudioModeConfigured() {
  if (audioModeConfigured) return;
  try {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch((err: any) => {
      console.warn('Failed to set audio mode playsInSilentMode:', err);
    });
    audioModeConfigured = true;
  } catch {
    // ignore
  }
}

function getAudioSource(assetRequire: any) {
  try {
    const resolved = Image.resolveAssetSource(assetRequire);
    if (resolved && resolved.uri) {
      let uri = resolved.uri;
      if (Platform.OS === 'web' && uri.startsWith('/')) {
        if (typeof window !== 'undefined') {
          uri = window.location.origin + uri;
        }
      }
      return { uri };
    }
  } catch (e) {
    console.warn('Failed to resolve asset source:', e);
  }
  return assetRequire;
}

function getMilestonePlayer() {
  ensureAudioModeConfigured();
  if (!milestonePlayer) {
    try {
      const { createAudioPlayer } = require('expo-audio');
      const source = getAudioSource(require('../../../assets/sounds/milestone.mp3'));
      milestonePlayer = createAudioPlayer(source);
    } catch (e) {
      console.warn('Failed to load milestone audio player:', e);
    }
  }
  return milestonePlayer;
}

function getHoorayPlayer() {
  ensureAudioModeConfigured();
  if (!hoorayPlayer) {
    try {
      const { createAudioPlayer } = require('expo-audio');
      const source = getAudioSource(require('../../../assets/sounds/hooray.mp3'));
      hoorayPlayer = createAudioPlayer(source);
    } catch (e) {
      console.warn('Failed to load hooray audio player:', e);
    }
  }
  return hoorayPlayer;
}

function getCoinPlayer() {
  ensureAudioModeConfigured();
  if (!coinPlayer) {
    try {
      const { createAudioPlayer } = require('expo-audio');
      const source = getAudioSource(require('../../../assets/sounds/coin.wav'));
      coinPlayer = createAudioPlayer(source);
    } catch (e) {
      console.warn('Failed to load coin audio player:', e);
    }
  }
  return coinPlayer;
}

/** Play coin clink sound when coins fly */
export function playCoinSound() {
  try {
    const player = getCoinPlayer();
    if (player) {
      player.seekTo(0);
      player.play();
    }
  } catch (e) {
    console.warn('Failed to play coin audio:', e);
  }
}

/** Play milestone completed sound and haptics */
export function playMilestoneSound() {
  try {
    // 1. Play audio chime
    const player = getMilestonePlayer();
    if (player) {
      player.seekTo(0);
      player.play();
    }
  } catch (e) {
    console.warn('Failed to play milestone audio:', e);
  }

  try {
    // 2. Play haptics
    const Haptics = getHaptics();
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // silently fail
  }
}

/** Play goal completed (hooray/confetti) sound and haptics */
export function playGoalCompleteSound() {
  try {
    // 1. Play celebratory hooray sound
    const player = getHoorayPlayer();
    if (player) {
      player.seekTo(0);
      player.play();
    }
  } catch (e) {
    console.warn('Failed to play hooray audio:', e);
  }

  try {
    // 2. Play haptics
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

