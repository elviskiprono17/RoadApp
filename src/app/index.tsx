import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGoal } from '@/storage/goalStorage';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, onboardingCompleted } = useAuth();
  const { canCreateGoal } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.replace('/(auth)/login' as Href);
      return;
    }

    // Redirect to onboarding if not completed
    if (!onboardingCompleted) {
      router.replace('/(onboarding)/questions' as Href);
      return;
    }

    checkExistingGoal();
  }, [authLoading, user, onboardingCompleted]);

  async function checkExistingGoal() {
    const goal = await getGoal();
    if (goal) {
      // Check if the goal is fully complete but wasn't archived
      // (e.g. user closed the app before the archive delay fired)
      const isComplete =
        goal.type === 'numerical'
          ? goal.targetValue !== undefined && goal.currentValue >= goal.targetValue
          : goal.milestones.every((m) => m.completed);

      if (isComplete) {
        // Auto-archive the stale completed goal
        try {
          const { archiveGoal } = await import('@/storage/goalStorage');
          await archiveGoal({ ...goal, completedAt: new Date().toISOString() });
        } catch {
          // Continue even if archive fails
        }
        // Show the create page
        setLoading(false);
        startAnimations();
        return;
      }

      router.replace('/roadmap' as Href);
    } else {
      setLoading(false);
      startAnimations();
    }
  }

  function startAnimations() {
    // Fade in the + button
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    // Start pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }

  function handleNewGoal() {
    if (!canCreateGoal) {
      router.push('/paywall' as Href);
    } else {
      router.push('/create' as Href);
    }
  }

  if (loading || authLoading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* ── Top Navbar ── */}
      <SafeAreaView edges={['top']} style={styles.navbarSafe}>
        <View style={styles.navbar}>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={styles.hamburgerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>RoadApp</Text>
          <View style={styles.navPlaceholder} />
        </View>
      </SafeAreaView>

      {/* ── Main Content ── */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.plusWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.plusButton}
            onPress={handleNewGoal}
            activeOpacity={0.8}
          >
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text style={[styles.hint, { opacity: fadeAnim }]}>
          Tap to set a new goal
        </Animated.Text>
      </View>

      {/* ── Hamburger Menu Drawer ── */}
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        goal={null}
        onHistoryPress={() => {
          setShowMenu(false);
          router.push('/history' as Href);
        }}
        onNewGoalPress={() => {
          setShowMenu(false);
          handleNewGoal();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  navbarSafe: {
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  navPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusWrapper: {
    marginBottom: 24,
  },
  plusButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  plusText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1a1a2e',
    marginTop: -3,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

