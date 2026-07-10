import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { Goal } from '../types/goal';
import { useAuth } from '../context/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
  onHistoryPress: () => void;
  onNewGoalPress?: () => void;
}

export default function HamburgerMenu({
  visible,
  onClose,
  goal,
  onHistoryPress,
  onNewGoalPress,
}: HamburgerMenuProps) {
  const router = useRouter();
  const { user, profile, isPremium, signOut: authSignOut } = useAuth();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [feedbackText, setFeedbackText] = useState('');
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible]);

  function handleFeedbackSubmit() {
    if (!feedbackText.trim()) {
      Alert.alert('Empty Feedback', 'Please write something before submitting.');
      return;
    }
    Alert.alert(
      'Thank You! 💛',
      'Your feedback has been received. We appreciate you taking the time to share your thoughts!',
      [{ text: 'OK', onPress: () => setFeedbackText('') }],
    );
  }

  if (!isRendered) return null;



  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ═══ USER PROFILE ═══ */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.display_name || 'User'}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>
              <View style={[
                styles.tierBadge,
                isPremium && styles.tierBadgePremium,
              ]}>
                <Text style={[
                  styles.tierBadgeText,
                  isPremium && styles.tierBadgeTextPremium,
                ]}>
                  {isPremium ? '⭐ PRO' : 'FREE'}
                </Text>
              </View>
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => {
                  onClose();
                  router.push('/paywall' as Href);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.upgradeEmoji}>👑</Text>
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            {/* ═══ NEW GOAL BUTTON ═══ */}
            <TouchableOpacity
              style={styles.newGoalButton}
              onPress={onNewGoalPress}
              activeOpacity={0.7}
            >
              <Text style={styles.newGoalEmoji}>✨</Text>
              <Text style={styles.newGoalText}>New Goal</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* ═══ HISTORY BUTTON ═══ */}
            <TouchableOpacity
              style={styles.historyButton}
              onPress={onHistoryPress}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>History</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* ═══ FEEDBACK SECTION ═══ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>💬</Text>
                <Text style={styles.sectionTitle}>Feedback</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                We'd love to hear your thoughts
              </Text>

              <TextInput
                style={styles.feedbackInput}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Share your feedback, suggestions, or report a bug..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                numberOfLines={7}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFeedbackSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>
                  Submit Feedback
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* ═══ SIGN OUT ═══ */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                      onClose();
                      try {
                        await authSignOut();
                      } catch (e) {
                        console.error('Sign out error:', e);
                      }
                      // Navigate to index which has the auth guard —
                      // it detects user=null and redirects to login.
                      router.replace('/' as Href);
                    },
                  },
                ]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutEmoji}>🚪</Text>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0f1629',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  drawerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
    marginLeft: 28,
  },
  chevron: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },

  // History button
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },

  // New Goal button
  newGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.15)',
    gap: 10,
    marginBottom: 8,
  },
  newGoalEmoji: {
    fontSize: 20,
  },
  newGoalText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5C518',
    letterSpacing: 0.3,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    marginLeft: 28,
  },

  // Feedback
  feedbackInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 160,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245,197,24,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5C518',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tierBadgePremium: {
    backgroundColor: 'rgba(245,197,24,0.15)',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  tierBadgeTextPremium: {
    color: '#F5C518',
  },

  // Upgrade button
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,197,24,0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.12)',
    gap: 10,
    marginBottom: 4,
  },
  upgradeEmoji: {
    fontSize: 18,
  },
  upgradeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5C518',
    flex: 1,
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  signOutEmoji: {
    fontSize: 18,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
});
