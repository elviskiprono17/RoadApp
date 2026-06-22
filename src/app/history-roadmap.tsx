import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArchivedGoal } from '@/storage/goalStorage';
import WindingRoad from '@/components/WindingRoad';
import type { Goal } from '@/types/goal';

export default function HistoryRoadmapScreen() {
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoal();
  }, []);

  async function loadGoal() {
    if (!goalId) {
      Alert.alert('Error', 'No goal ID provided.');
      router.back();
      return;
    }

    const archived = await getArchivedGoal(goalId);
    if (!archived) {
      Alert.alert('Not Found', 'This goal could not be found.');
      router.back();
      return;
    }

    // Mark everything as fully completed for the read-only view
    const completedGoal: Goal = {
      ...archived,
      currentValue:
        archived.type === 'numerical'
          ? archived.targetValue || archived.currentValue
          : archived.milestones.length,
      milestones: archived.milestones.map((m) => ({
        ...m,
        completed: true,
      })),
    };

    setGoal(completedGoal);
    setLoading(false);
  }

  if (loading || !goal) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {goal.title}
          </Text>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Completed</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Winding road (read-only) ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WindingRoad
          goal={goal}
          selectedMilestone={-1}
          onMilestonePress={() => {}}
        />
      </ScrollView>

      {/* ── Completion banner ── */}
      <View style={styles.completeBanner}>
        <Text style={styles.completeEmoji}>🏆</Text>
        <Text style={styles.completeText}>Goal Complete!</Text>
      </View>
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
  backButton: {
    width: 60,
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5C518',
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  completedBadge: {
    backgroundColor: 'rgba(80,200,120,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.3)',
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#50C878',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
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
});
