import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  Easing,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGoal, updateGoal } from '@/storage/goalStorage';
import WindingRoad from '@/components/WindingRoad';
import type { Goal } from '@/types/goal';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function RoadmapScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateValue, setUpdateValue] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState(-1);

  // Update button animation
  const buttonTranslateY = useRef(new Animated.Value(0)).current;
  const isButtonVisible = useRef(true);
  const lastScrollY = useRef(0);

  // Scroll ref
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadGoal();
  }, []);

  async function loadGoal() {
    const g = await getGoal();
    if (!g) {
      router.replace('/' as Href);
      return;
    }
    setGoal(g);
    setLoading(false);
  }

  // Scroll to current progress position on first load
  useEffect(() => {
    if (goal && scrollRef.current) {
      const numMilestones = goal.milestones.length;
      const segmentHeight = 260;
      const paddingBottom = 120;
      const totalHeight =
        100 + paddingBottom + (numMilestones + 1) * segmentHeight;

      let completedCount: number;
      if (goal.type === 'numerical') {
        completedCount = goal.milestones.filter(
          (m) => m.value !== undefined && goal.currentValue >= m.value,
        ).length;
      } else {
        completedCount = goal.milestones.filter((m) => m.completed).length;
      }

      // Scroll to area near current milestone (or bottom for 0 progress)
      const currentMilestoneIndex = Math.min(
        completedCount,
        numMilestones - 1,
      );
      const targetY =
        totalHeight -
        paddingBottom -
        (currentMilestoneIndex + 1) * segmentHeight -
        SCREEN_HEIGHT / 3;

      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, targetY),
          animated: false,
        });
      }, 100);
    }
  }, [goal]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const delta = currentY - lastScrollY.current;

      if (delta < -8 && isButtonVisible.current) {
        // Scrolling up (toward finish) — hide button
        isButtonVisible.current = false;
        Animated.spring(buttonTranslateY, {
          toValue: 120,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }).start();
      } else if (delta > 8 && !isButtonVisible.current) {
        // Scrolling down (toward start) — show button
        isButtonVisible.current = true;
        Animated.spring(buttonTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }).start();
      }

      lastScrollY.current = currentY;
    },
    [],
  );

  // ─── Update handlers ────────────────────────────────────
  function openUpdateModal() {
    if (!goal) return;

    if (goal.type === 'numerical') {
      setUpdateValue(goal.currentValue.toString());
    }
    setShowUpdateModal(true);
  }

  async function handleNumericalUpdate() {
    if (!goal) return;
    const newValue = parseFloat(updateValue);
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('Invalid', 'Please enter a valid number.');
      return;
    }

    const clampedValue = Math.min(newValue, goal.targetValue || newValue);
    const updatedGoal: Goal = {
      ...goal,
      currentValue: clampedValue,
      milestones: goal.milestones.map((m) => ({
        ...m,
        completed: m.value !== undefined && clampedValue >= m.value,
      })),
    };

    await updateGoal(updatedGoal);
    setGoal(updatedGoal);
    setShowUpdateModal(false);
  }

  async function handleCustomMilestoneComplete() {
    if (!goal) return;

    // Find the first incomplete milestone
    const nextIndex = goal.milestones.findIndex((m) => !m.completed);
    if (nextIndex === -1) return; // All done

    const updatedMilestones = [...goal.milestones];
    updatedMilestones[nextIndex] = {
      ...updatedMilestones[nextIndex],
      completed: true,
    };

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      currentValue: updatedMilestones.filter((m) => m.completed).length,
    };

    await updateGoal(updatedGoal);
    setGoal(updatedGoal);
    setShowUpdateModal(false);
  }

  // ─── Render ─────────────────────────────────────────────
  if (loading || !goal) {
    return <View style={styles.container} />;
  }

  // Find current milestone for custom goals
  const currentMilestoneIndex = goal.milestones.findIndex(
    (m) => !m.completed,
  );
  const currentMilestone =
    currentMilestoneIndex >= 0
      ? goal.milestones[currentMilestoneIndex]
      : null;

  // Check if goal is complete
  const isGoalComplete =
    goal.type === 'numerical'
      ? goal.currentValue >= (goal.targetValue || 0)
      : goal.milestones.every((m) => m.completed);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.push('/settings' as Href)}
            style={styles.hamburgerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {goal.title}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/settings' as Href)}
            style={styles.settingsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(
                  100,
                  goal.type === 'numerical'
                    ? ((goal.currentValue / (goal.targetValue || 1)) * 100)
                    : ((goal.milestones.filter((m) => m.completed).length /
                        goal.milestones.length) *
                        100),
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {goal.type === 'numerical'
            ? `${goal.unit || ''}${goal.currentValue.toLocaleString()} / ${goal.unit || ''}${(goal.targetValue || 0).toLocaleString()}`
            : `${goal.milestones.filter((m) => m.completed).length} / ${goal.milestones.length} milestones`}
        </Text>
      </SafeAreaView>

      {/* ── Winding road ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <WindingRoad
          goal={goal}
          selectedMilestone={selectedMilestone}
          onMilestonePress={(i) =>
            setSelectedMilestone(selectedMilestone === i ? -1 : i)
          }
        />
      </ScrollView>

      {/* ── Update button (floating) ── */}
      {!isGoalComplete && (
        <Animated.View
          style={[
            styles.updateButtonContainer,
            { transform: [{ translateY: buttonTranslateY }] },
          ]}
        >
          <TouchableOpacity
            style={styles.updateButton}
            onPress={openUpdateModal}
            activeOpacity={0.85}
          >
            <Text style={styles.updateButtonText}>UPDATE</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Goal complete banner ── */}
      {isGoalComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeEmoji}>🏆</Text>
          <Text style={styles.completeText}>Goal Complete!</Text>
        </View>
      )}

      {/* ── Update Modal ── */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Progress</Text>

            {goal.type === 'numerical' ? (
              <>
                <Text style={styles.modalLabel}>
                  Current value ({goal.unit || ''})
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={updateValue}
                  onChangeText={setUpdateValue}
                  keyboardType="numeric"
                  placeholder={`e.g. ${Math.round((goal.targetValue || 0) / 2)}`}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleNumericalUpdate}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {currentMilestone ? (
                  <View style={styles.milestoneCard}>
                    <Text style={styles.milestoneCardLabel}>
                      Next milestone:
                    </Text>
                    <Text style={styles.milestoneCardTitle}>
                      {`${currentMilestoneIndex + 1}. ${currentMilestone.label}`}
                    </Text>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={handleCustomMilestoneComplete}
                    >
                      <Text style={styles.completeButtonText}>
                        ✓ Mark Complete
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.allDoneText}>
                    All milestones completed! 🎉
                  </Text>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowUpdateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },

  // Header
  header: {
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hamburgerButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  settingsIcon: {
    fontSize: 22,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginHorizontal: 20,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
  },

  // Update button
  updateButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 2,
  },

  // Complete banner
  completeBanner: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 36,
  },
  completeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5C518',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#00E676',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },

  // Milestone card in modal
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  milestoneCardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  milestoneCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#00E676',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  allDoneText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 20,
  },
});
