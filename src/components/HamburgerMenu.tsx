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
import { useTheme, type ThemeName } from '../context/ThemeContext';
import type { Goal } from '../types/goal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
}

// ─── Theme config ────────────────────────────────────────────
const THEMES: { key: ThemeName; emoji: string; label: string; desc: string; color: string }[] = [
  {
    key: 'space',
    emoji: '🚀',
    label: 'Space',
    desc: 'Rockets, stars & planets',
    color: '#7E57C2',
  },
  {
    key: 'egyptians',
    emoji: '🏺',
    label: 'Egyptians',
    desc: 'Pyramids, scarabs & pharaohs',
    color: '#E0A96D',
  },
  {
    key: 'ocean',
    emoji: '🌊',
    label: 'Ocean',
    desc: 'Fish, shells & waves',
    color: '#42A5F5',
  },
];

export default function HamburgerMenu({
  visible,
  onClose,
  goal,
}: HamburgerMenuProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [feedbackText, setFeedbackText] = useState('');
  const { theme, setTheme } = useTheme();
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

  // ─── History data ────────────────────────────────────────
  let historyContent = null;
  if (goal) {
    const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const completedCount =
      goal.type === 'numerical'
        ? goal.milestones.filter(
            (m) => m.value !== undefined && goal.currentValue >= m.value,
          ).length
        : goal.milestones.filter((m) => m.completed).length;

    const totalMilestones = goal.milestones.length;
    const percentage = Math.round((completedCount / totalMilestones) * 100);

    historyContent = (
      <View style={styles.historyContent}>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Goal</Text>
          <Text style={styles.historyValue} numberOfLines={1}>
            {goal.title}
          </Text>
        </View>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Started</Text>
          <Text style={styles.historyValue}>{createdDate}</Text>
        </View>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Progress</Text>
          <Text style={styles.historyValue}>
            {completedCount} / {totalMilestones} milestones
          </Text>
        </View>
        {goal.type === 'numerical' && (
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Value</Text>
            <Text style={styles.historyValue}>
              {goal.unit || ''}
              {goal.currentValue.toLocaleString()} / {goal.unit || ''}
              {(goal.targetValue || 0).toLocaleString()}
            </Text>
          </View>
        )}
        {/* Mini progress bar */}
        <View style={styles.miniProgressBg}>
          <View
            style={[
              styles.miniProgressFill,
              { width: `${Math.min(100, percentage)}%` },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{percentage}% complete</Text>
      </View>
    );
  }

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

            {/* ═══ HISTORY SECTION ═══ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>📜</Text>
                <Text style={styles.sectionTitle}>History</Text>
              </View>
              {historyContent || (
                <Text style={styles.emptyText}>No goal created yet</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* ═══ THEMES SECTION ═══ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>🎨</Text>
                <Text style={styles.sectionTitle}>Themes</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Choose a theme to decorate the roadside
              </Text>

              {THEMES.map((t) => {
                const isActive = theme === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.themeCard,
                      isActive && { borderColor: t.color, backgroundColor: `${t.color}15` },
                    ]}
                    onPress={() => setTheme(t.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeCardLeft}>
                      <Text style={styles.themeEmoji}>{t.emoji}</Text>
                      <View>
                        <Text style={[styles.themeLabel, isActive && { color: t.color }]}>
                          {t.label}
                        </Text>
                        <Text style={styles.themeDesc}>{t.desc}</Text>
                      </View>
                    </View>
                    {isActive && (
                      <View style={[styles.activeIndicator, { backgroundColor: t.color }]}>
                        <Text style={styles.activeCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

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
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !feedbackText.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleFeedbackSubmit}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    !feedbackText.trim() && styles.submitButtonTextDisabled,
                  ]}
                >
                  Submit Feedback
                </Text>
              </TouchableOpacity>
            </View>

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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },

  // History
  historyContent: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  historyValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  miniProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#50C878',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: 'rgba(80,200,120,0.7)',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    marginLeft: 28,
  },

  // Themes
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  themeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeEmoji: {
    fontSize: 28,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  themeDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  activeIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    minHeight: 110,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(245,197,24,0.2)',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  submitButtonTextDisabled: {
    color: 'rgba(26,26,46,0.4)',
  },
});
