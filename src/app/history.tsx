import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHistory } from '@/storage/goalStorage';
import type { Goal } from '@/types/goal';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  async function loadHistory() {
    const history = await getHistory();
    // Most recently completed first
    history.sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tb - ta;
    });
    setGoals(history);
  }

  function renderCard({ item }: { item: Goal }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() =>
          router.push(`/history-roadmap?goalId=${item.id}` as Href)
        }
      >
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>✓</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.completedAt && (
          <Text style={styles.cardDate}>{formatDate(item.completedAt)}</Text>
        )}

        <Text style={styles.cardMilestones}>
          {item.milestones.length} milestones
        </Text>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyText}>No past goals yet</Text>
      </View>
    );
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
          <Text style={styles.headerTitle}>History</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* ── Grid ── */}
      <FlatList
        data={goals}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={
          goals.length === 0 ? styles.emptyList : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 70,
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5C518',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 70,
  },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#50C878',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  cardMilestones: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },

  // Empty
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
  },
});
