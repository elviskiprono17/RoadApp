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
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Alert,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGoal, updateGoal, archiveGoal } from '@/storage/goalStorage';
import WindingRoad from '@/components/WindingRoad';
import HamburgerMenu from '@/components/HamburgerMenu';
import Confetti from '@/components/Confetti';
import type { Goal } from '@/types/goal';
import { useAuth } from '@/context/AuthContext';
import { playMilestoneSound, playGoalCompleteSound, playProgressSound, playCoinSound } from '@/utils/sounds';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Accent blue used across the UI
const ACCENT_BLUE = '#2563EB';

export default function RoadmapScreen() {
  const router = useRouter();
  const { canCreateGoal } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateValue, setUpdateValue] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState(-1);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Delayed progress: holds the OLD fraction so user can watch the line animate
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const progressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coin-fly animation state
  const [showCoinFly, setShowCoinFly] = useState(false);
  const NUM_COINS = 8;
  const coinAnims = useRef(
    Array.from({ length: NUM_COINS }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;
  const rootRef = useRef<View>(null);
  const progressBarRef = useRef<View>(null);
  const progressBarFlash = useRef(new Animated.Value(0)).current;
  // Measure the progress bar's position on screen
  const progressBarY = useRef(110); // Default layout fallback (below status bar)
  const coinStartY = useRef(SCREEN_HEIGHT * 0.55); // default start from lower-mid screen

  // Delayed header progress: holds the OLD fraction so top progress bar updates only after coins land
  const [displayHeaderProgress, setDisplayHeaderProgress] = useState<number | null>(null);
  const headerProgressAnim = useRef(new Animated.Value(0)).current;

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
    // Initialize header progress anim value directly
    const initialPercent = calculateProgressFraction(g) * 100;
    headerProgressAnim.setValue(initialPercent);
  }

  // Smoothly animate the top progress bar width
  useEffect(() => {
    if (goal) {
      const targetPercent =
        displayHeaderProgress !== null
          ? displayHeaderProgress * 100
          : calculateProgressFraction(goal) * 100;

      Animated.timing(headerProgressAnim, {
        toValue: targetPercent,
        duration: displayHeaderProgress !== null ? 0 : 600, // Instant when frozen, animated when released
        useNativeDriver: false,
      }).start();
    }
  }, [goal, displayHeaderProgress]);

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

  // ─── Progress fraction calculation ─────────────────────
  function calculateProgressFraction(g: Goal): number {
    if (g.type === 'numerical') {
      if (!g.targetValue || g.targetValue <= 0) return 0;
      return Math.min(1, Math.max(0, g.currentValue / g.targetValue));
    }

    // Custom goal: milestones + sub-milestones
    const numMilestones = g.milestones.length;
    if (numMilestones === 0) return 0;

    let totalProgress = 0;
    for (let i = 0; i < numMilestones; i++) {
      const m = g.milestones[i];
      if (m.completed) {
        totalProgress += 1;
      } else if (m.subMilestones && m.subMilestones.length > 0) {
        const completedSubs = m.subMilestones.filter((s) => s.completed).length;
        totalProgress += completedSubs / m.subMilestones.length;
        break;
      } else {
        break;
      }
    }

    return Math.min(1, totalProgress / numMilestones);
  }

  // ─── Update handlers ────────────────────────────────────
  function openUpdateModal() {
    if (!goal) return;

    if (goal.type === 'numerical') {
      setUpdateValue(goal.currentValue.toString());
    }
    setShowUpdateModal(true);
  }

  // Trigger the coin-fly animation — stack of coins converge and deposit into progress bar
  function triggerCoinFly() {
    // Reset all coin animations
    coinAnims.forEach((coin) => {
      coin.translateY.setValue(0);
      coin.translateX.setValue(0);
      coin.scale.setValue(0);
      coin.opacity.setValue(0);
    });
    progressBarFlash.setValue(0);
    setShowCoinFly(true);
    playCoinSound();

    const animations = coinAnims.map((coin, i) => {
      // Scatter coins as a cluster/stack at the start around screen center
      const row = Math.floor(i / 3); // 3 columns, multiple rows
      const col = i % 3;
      const startX = (col - 1) * 35 + (Math.random() - 0.5) * 20;
      const startY = coinStartY.current + row * 25 + (Math.random() - 0.5) * 15;

      coin.translateX.setValue(startX);
      coin.translateY.setValue(startY);

      const stagger = i * 40;

      return Animated.sequence([
        Animated.delay(stagger),
        Animated.parallel([
          // Phase 1: Fly upward to the progress bar absolute Y position
          Animated.timing(coin.translateY, {
            toValue: progressBarY.current,
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          // Converge horizontally — all coins come to the center (middle) of the progress bar
          Animated.timing(coin.translateX, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          // Fade in immediately and stay fully visible
          Animated.timing(coin.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          // Scale: pop in then gradually shrink as they converge
          Animated.sequence([
            Animated.timing(coin.scale, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(coin.scale, {
              toValue: 0.6,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Phase 2: HOLD at the progress bar so user can see the deposit
        Animated.delay(400),
        // Phase 3: Fade out as they merge into the bar
        Animated.timing(coin.opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      // Release the top progress bar to animate to the new value now that coins have arrived!
      setDisplayHeaderProgress(null);

      // Flash the progress bar to show the deposit landed
      Animated.sequence([
        Animated.timing(progressBarFlash, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.delay(300),
        Animated.timing(progressBarFlash, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowCoinFly(false);
      });
    });
  }

  async function handleNumericalUpdate() {
    if (!goal) return;
    const newValue = parseFloat(updateValue);
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('Invalid', 'Please enter a valid number.');
      return;
    }

    // Snapshot old progress before updating
    const oldFraction = calculateProgressFraction(goal);

    const clampedValue = Math.min(newValue, goal.targetValue || newValue);
    const updatedGoal: Goal = {
      ...goal,
      currentValue: clampedValue,
      milestones: goal.milestones.map((m) => ({
        ...m,
        completed: m.value !== undefined && clampedValue >= m.value,
      })),
    };

    // Count newly completed milestones
    const prevCompleted = goal.milestones.filter((m) => m.completed).length;
    const newCompleted = updatedGoal.milestones.filter((m) => m.completed).length;

    await updateGoal(updatedGoal);
    setShowUpdateModal(false);

    // Freeze progress at old value, then animate to new
    setDisplayProgress(oldFraction);
    setDisplayHeaderProgress(oldFraction);
    setGoal(updatedGoal);

    const isNowComplete = clampedValue >= (goal.targetValue || 0);

    // Play sound and animate after a short delay
    setTimeout(() => {
      playProgressSound();
      setDisplayProgress(null); // releases to real value → line animates

      // Play milestone sound for each newly completed milestone EXCEPT if the goal is complete
      if (newCompleted > prevCompleted && !isNowComplete) {
        setTimeout(() => playMilestoneSound(), 400);
      }
    }, 800);

    // Trigger coin-fly after the road line finishes animating
    setTimeout(() => {
      triggerCoinFly();
    }, 2000);

    // Auto-archive if goal is now complete
    if (isNowComplete) {
      setTimeout(() => {
        playGoalCompleteSound();
      }, 3600);
      setTimeout(() => {
        setShowConfetti(true);
      }, 4200);
      setTimeout(async () => {
        await archiveGoal({ ...updatedGoal, completedAt: new Date().toISOString() });
      }, 7200);
    }
  }

  async function handleCustomMilestoneComplete() {
    if (!goal) return;

    // Find the first incomplete milestone
    const nextIndex = goal.milestones.findIndex((m) => !m.completed);
    if (nextIndex === -1) return; // All done

    // Snapshot old progress
    const oldFraction = calculateProgressFraction(goal);

    const updatedMilestones = [...goal.milestones];
    updatedMilestones[nextIndex] = {
      ...updatedMilestones[nextIndex],
      completed: true,
      // Mark all sub-milestones as completed too
      subMilestones: updatedMilestones[nextIndex].subMilestones?.map((s) => ({
        ...s,
        completed: true,
      })),
    };

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      currentValue: updatedMilestones.filter((m) => m.completed).length,
    };

    await updateGoal(updatedGoal);
    setShowUpdateModal(false);

    // Freeze progress then animate
    setDisplayProgress(oldFraction);
    setDisplayHeaderProgress(oldFraction);
    setGoal(updatedGoal);

    // Auto-archive if all milestones are now complete
    const isNowComplete = updatedMilestones.every((m) => m.completed);

    setTimeout(() => {
      playProgressSound();
      setDisplayProgress(null);
      if (!isNowComplete) {
        setTimeout(() => playMilestoneSound(), 400);
      }
    }, 800);

    // Trigger coin-fly after the road line finishes animating
    setTimeout(() => {
      triggerCoinFly();
    }, 2000);

    if (isNowComplete) {
      setTimeout(() => {
        playGoalCompleteSound();
      }, 3600);
      setTimeout(() => {
        setShowConfetti(true);
      }, 4200);
      setTimeout(async () => {
        await archiveGoal({ ...updatedGoal, completedAt: new Date().toISOString() });
      }, 7200);
    }
  }

  async function handleToggleSubMilestone(milestoneIndex: number, subIndex: number) {
    if (!goal) return;

    // Snapshot old progress
    const oldFraction = calculateProgressFraction(goal);
    const prevCompleted = goal.milestones.filter((m) => m.completed).length;

    const updatedMilestones = goal.milestones.map((m, i) => {
      if (i !== milestoneIndex) return m;
      if (!m.subMilestones || m.subMilestones.length === 0) return m;

      const updatedSubs = m.subMilestones.map((s, si) =>
        si === subIndex ? { ...s, completed: !s.completed } : s,
      );

      // Only auto-complete when every sub-milestone is checked
      const allSubsComplete =
        updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);

      return {
        ...m,
        subMilestones: updatedSubs,
        completed: allSubsComplete,
      };
    });

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      currentValue: updatedMilestones.filter((m) => m.completed).length,
    };

    await updateGoal(updatedGoal);

    // Freeze and animate progress
    setDisplayProgress(oldFraction);
    setDisplayHeaderProgress(oldFraction);
    setGoal(updatedGoal);

    const newCompleted = updatedMilestones.filter((m) => m.completed).length;
    const isNowComplete = updatedMilestones.every((m) => m.completed);

    setTimeout(() => {
      playProgressSound();
      setDisplayProgress(null);

      // If a milestone just completed via all subs being checked EXCEPT if the goal is complete
      if (newCompleted > prevCompleted && !isNowComplete) {
        setTimeout(() => playMilestoneSound(), 400);
      }
    }, 800);

    // Trigger coin-fly after the road line finishes animating
    setTimeout(() => {
      triggerCoinFly();
    }, 2000);

    // Auto-archive if all milestones are now complete
    if (isNowComplete) {
      setShowUpdateModal(false);
      setTimeout(() => {
        playGoalCompleteSound();
      }, 3600);
      setTimeout(() => {
        setShowConfetti(true);
      }, 4200);
      setTimeout(async () => {
        await archiveGoal({ ...updatedGoal, completedAt: new Date().toISOString() });
      }, 7200);
    }
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

  // Calculate progress percentage for the header bar
  const progressPercent = Math.min(
    100,
    goal.type === 'numerical'
      ? ((goal.currentValue / (goal.targetValue || 1)) * 100)
      : ((goal.milestones.filter((m) => m.completed).length /
          goal.milestones.length) *
          100),
  );

  // For custom goals with sub-milestones, show finer-grained progress in header
  const headerProgressPercent = (() => {
    if (goal.type === 'numerical') return progressPercent;
    return calculateProgressFraction(goal) * 100;
  })();

  return (
    <View ref={rootRef} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
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
        <View
          ref={progressBarRef}
          collapsable={false}
          style={styles.progressBarBg}
          onLayout={() => {
            progressBarRef.current?.measureLayout(
              rootRef.current as any,
              (_x: number, y: number) => {
                if (y > 0) progressBarY.current = y + 2; // Center vertically on progress bar
              },
              () => console.log('measureLayout error')
            );
          }}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: headerProgressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          {/* Flash glow when coins deposit */}
          <Animated.View
            style={[
              styles.progressBarGlow,
              {
                width: headerProgressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                opacity: progressBarFlash,
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
        scrollEventThrottle={32}
        decelerationRate="normal"
      >
        <WindingRoad
          goal={goal}
          selectedMilestone={selectedMilestone}
          onMilestonePress={(i) =>
            setSelectedMilestone(selectedMilestone === i ? -1 : i)
          }
          progressFraction={displayProgress ?? calculateProgressFraction(goal)}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
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

                    {/* Sub-milestones checklist */}
                    {currentMilestone.subMilestones &&
                      currentMilestone.subMilestones.length > 0 && (
                        <View style={styles.subChecklist}>
                          <Text style={styles.subChecklistTitle}>
                            Sub-goals ({currentMilestone.subMilestones.filter((s) => s.completed).length}/{currentMilestone.subMilestones.length})
                          </Text>
                          <ScrollView
                            style={styles.subChecklistScroll}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                          >
                            {currentMilestone.subMilestones.map((sub, subIdx) => (
                              <TouchableOpacity
                                key={sub.id}
                                style={styles.subChecklistItem}
                                onPress={() =>
                                  handleToggleSubMilestone(
                                    currentMilestoneIndex,
                                    subIdx,
                                  )
                                }
                                activeOpacity={0.7}
                              >
                                <View
                                  style={[
                                    styles.subCheckbox,
                                    sub.completed && styles.subCheckboxChecked,
                                  ]}
                                >
                                  {sub.completed && (
                                    <Text style={styles.subCheckmark}>✓</Text>
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.subChecklistLabel,
                                    sub.completed && styles.subChecklistLabelDone,
                                  ]}
                                >
                                  {sub.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    {/* Mark Complete — only for milestones without sub-goals */}
                    {(!currentMilestone.subMilestones ||
                      currentMilestone.subMilestones.length === 0) ? (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleCustomMilestoneComplete}
                      >
                        <Text style={styles.completeButtonText}>
                          ✓ Mark Complete
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => setShowUpdateModal(false)}
                      >
                        <Text style={styles.completeButtonText}>
                          Done
                        </Text>
                      </TouchableOpacity>
                    )}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Hamburger Menu Drawer ── */}
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        goal={goal}
        onHistoryPress={() => {
          setShowMenu(false);
          router.push('/history' as Href);
        }}
        onNewGoalPress={() => {
          setShowMenu(false);
          if (!canCreateGoal) {
            router.push('/paywall' as Href);
          } else {
            router.push('/create' as Href);
          }
        }}
      />

      {/* ── Coin-fly animation overlay ── */}
      {showCoinFly && (
        <View style={styles.coinFlyContainer} pointerEvents="none">
          {coinAnims.map((coin, i) => (
            <Animated.View
              key={`coin-${i}`}
              style={[
                styles.coin,
                {
                  transform: [
                    { translateY: coin.translateY },
                    { translateX: coin.translateX },
                    { scale: coin.scale },
                  ],
                  opacity: coin.opacity,
                },
              ]}
            >
              <View style={styles.coinInner}>
                <Text style={styles.coinSymbol}>¢</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* ── Confetti overlay ── */}
      <Confetti
        visible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
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
    backgroundColor: '#F5C518',
    borderRadius: 2,
  },
  progressBarGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    bottom: -2,
    backgroundColor: 'rgba(245, 197, 24, 0.6)',
    borderRadius: 4,
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
    backgroundColor: '#2563EB',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
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
    maxHeight: '80%',
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
    backgroundColor: ACCENT_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: ACCENT_BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allDoneText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 20,
  },

  // Sub-milestone checklist in modal
  subChecklist: {
    marginBottom: 16,
  },
  subChecklistTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  subChecklistScroll: {
    maxHeight: 200,
  },
  subChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  subCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCheckboxChecked: {
    backgroundColor: ACCENT_BLUE,
    borderColor: ACCENT_BLUE,
  },
  subCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subChecklistLabel: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  subChecklistLabelDone: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },

  // Coin-fly animation
  coinFlyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    overflow: 'visible',
  },
  coin: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5C518',
    borderWidth: 2.5,
    borderColor: '#C9A000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  coinSymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B6914',
    marginTop: -1,
  },
});
