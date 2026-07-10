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
import { getGoal } from '@/storage/goalStorage';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, canCreateGoal } = useAuth();
  const [loading, setLoading] = useState(true);
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

    checkExistingGoal();
  }, [authLoading, user]);

  async function checkExistingGoal() {
    const goal = await getGoal();
    if (goal) {
      router.replace('/roadmap' as Href);
    } else {
      setLoading(false);
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
