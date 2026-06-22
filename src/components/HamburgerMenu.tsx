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
import type { Goal } from '../types/goal';

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

            {/* ═══ NEW GOAL BUTTON ═══ */}
            <TouchableOpacity
              style={styles.newGoalButton}
              onPress={onNewGoalPress}
              activeOpacity={0.7}
            >
              <Text style={styles.newGoalEmoji}>🚀</Text>
              <Text style={styles.newGoalText}>New Goal</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* ═══ HISTORY SECTION (Clickable) ═══ */}
            <TouchableOpacity
              style={styles.section}
              onPress={onHistoryPress}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>📜</Text>
                <Text style={styles.sectionTitle}>History</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
              {historyContent || (
                <Text style={styles.emptyText}>No goal created yet</Text>
              )}
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
    backgroundColor: '#1B8A4A',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: 'rgba(27,138,74,0.8)',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'right',
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
});
