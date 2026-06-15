import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getGoal,
  updateGoal,
  deleteGoal,
} from '@/storage/goalStorage';
import { generateId, generateNumericalMilestones } from '@/types/goal';
import type { Goal } from '@/types/goal';

export default function SettingsScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [milestoneLabels, setMilestoneLabels] = useState<string[]>([]);

  useEffect(() => {
    loadGoal();
  }, []);

  async function loadGoal() {
    const g = await getGoal();
    if (!g) {
      router.back();
      return;
    }
    setGoal(g);
    setTitle(g.title);
    if (g.type === 'numerical') {
      setTargetValue((g.targetValue || 0).toString());
      setUnit(g.unit || '');
    } else {
      setMilestoneLabels(g.milestones.map((m) => m.label));
    }
    setLoading(false);
  }

  // ─── Save handlers ────────────────────────────────────
  async function handleSave() {
    if (!goal) return;

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Goal must have a name.');
      return;
    }

    if (goal.type === 'numerical') {
      const target = parseFloat(targetValue);
      if (isNaN(target) || target <= 0) {
        Alert.alert('Invalid Target', 'Please enter a valid target.');
        return;
      }

      // Regenerate milestones if target or unit changed
      const needsRegenerate =
        target !== goal.targetValue || unit.trim() !== (goal.unit || '');

      const newMilestones = needsRegenerate
        ? generateNumericalMilestones(target, unit.trim()).map((m) => ({
            ...m,
            completed:
              m.value !== undefined && goal.currentValue >= m.value,
          }))
        : goal.milestones;

      const updatedGoal: Goal = {
        ...goal,
        title: title.trim(),
        targetValue: target,
        unit: unit.trim(),
        milestones: newMilestones,
      };

      await updateGoal(updatedGoal);
      router.back();
    } else {
      // Custom goal
      const validLabels = milestoneLabels.filter((l) => l.trim());
      if (validLabels.length < 5) {
        Alert.alert('Need Milestones', 'At least 5 milestones required.');
        return;
      }

      // Preserve completion state for existing milestones, add new ones as incomplete
      const newMilestones = validLabels.map((label, i) => {
        const existing = goal.milestones[i];
        if (existing) {
          return { ...existing, label: label.trim() };
        }
        return {
          id: generateId(),
          label: label.trim(),
          completed: false,
        };
      });

      const updatedGoal: Goal = {
        ...goal,
        title: title.trim(),
        milestones: newMilestones,
        currentValue: newMilestones.filter((m) => m.completed).length,
      };

      await updateGoal(updatedGoal);
      router.back();
    }
  }

  function handleResetProgress() {
    Alert.alert(
      'Reset Progress',
      'This will reset all your progress to zero. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (!goal) return;
            const updatedGoal: Goal = {
              ...goal,
              currentValue: 0,
              milestones: goal.milestones.map((m) => ({
                ...m,
                completed: false,
              })),
            };
            await updateGoal(updatedGoal);
            setGoal(updatedGoal);
            router.back();
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Goal',
      'This will permanently delete your goal and all progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGoal();
            router.dismissAll();
          },
        },
      ],
    );
  }

  // ─── Custom milestone editing ──────────────────────────
  function addMilestone() {
    setMilestoneLabels((prev) => [...prev, '']);
  }

  function removeMilestone(index: number) {
    if (milestoneLabels.length <= 5) {
      Alert.alert('Minimum', 'You need at least 5 milestones.');
      return;
    }
    setMilestoneLabels((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMilestoneLabel(index: number, text: string) {
    setMilestoneLabels((prev) =>
      prev.map((m, i) => (i === index ? text : m)),
    );
  }

  // ─── Unit options ──────────────────────────────────────
  const units = ['$', '€', '£', 'kg', 'lbs', 'km', 'mi', 'hrs', ''];

  if (loading || !goal) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Goal Title */}
          <Text style={styles.label}>Goal Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Goal name"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />

          {/* ── Numerical settings ── */}
          {goal.type === 'numerical' && (
            <View style={styles.section}>
              <Text style={styles.label}>Target Value</Text>
              <TextInput
                style={styles.input}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                placeholder="Target amount"
                placeholderTextColor="rgba(255,255,255,0.25)"
              />

              <Text style={styles.label}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.unitScroll}
              >
                {units.map((u) => (
                  <TouchableOpacity
                    key={u || 'none'}
                    style={[
                      styles.unitChip,
                      unit === u && styles.unitChipActive,
                    ]}
                    onPress={() => setUnit(u)}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        unit === u && styles.unitChipTextActive,
                      ]}
                    >
                      {u || 'None'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ⚠️ Changing the target will regenerate milestones. Your
                  current progress value will be preserved.
                </Text>
              </View>
            </View>
          )}

          {/* ── Custom milestone editing ── */}
          {goal.type === 'custom' && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Milestones ({milestoneLabels.length})
              </Text>

              {milestoneLabels.map((label, index) => {
                const isCompleted =
                  goal.milestones[index]?.completed || false;
                return (
                  <View key={index} style={styles.milestoneRow}>
                    <View
                      style={[
                        styles.milestoneNumber,
                        isCompleted && styles.milestoneNumberCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.milestoneNumberText,
                          isCompleted &&
                            styles.milestoneNumberTextCompleted,
                        ]}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.milestoneInput,
                        isCompleted && styles.milestoneInputCompleted,
                      ]}
                      value={label}
                      onChangeText={(text) =>
                        updateMilestoneLabel(index, text)
                      }
                      placeholder={`Milestone ${index + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                    <TouchableOpacity
                      onPress={() => removeMilestone(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.addMilestoneButton}
                onPress={addMilestone}
              >
                <Text style={styles.addMilestoneText}>+ Add Milestone</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Danger zone ── */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleResetProgress}
            >
              <Text style={styles.dangerButtonText}>🔄 Reset Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[styles.dangerButtonText, styles.deleteText]}>
                🗑️ Delete Goal
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  safeTop: {
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '700',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Labels
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    marginTop: 20,
  },

  // Input
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  section: {
    marginTop: 4,
  },

  // Unit chips
  unitScroll: {
    marginBottom: 16,
  },
  unitChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unitChipActive: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.12)',
  },
  unitChipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#F5C518',
  },

  // Info
  infoBox: {
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.15)',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(245,197,24,0.8)',
    lineHeight: 18,
  },

  // Milestones
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,230,118,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberCompleted: {
    backgroundColor: 'rgba(120,144,156,0.2)',
  },
  milestoneNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E676',
  },
  milestoneNumberTextCompleted: {
    color: '#78909C',
  },
  milestoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  milestoneInputCompleted: {
    opacity: 0.5,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,23,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF1744',
    fontSize: 14,
    fontWeight: '700',
  },
  addMilestoneButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  addMilestoneText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontWeight: '600',
  },

  // Danger zone
  dangerZone: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,23,68,0.15)',
    paddingTop: 20,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,23,68,0.7)',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  deleteButton: {
    borderColor: 'rgba(255,23,68,0.2)',
    backgroundColor: 'rgba(255,23,68,0.06)',
  },
  deleteText: {
    color: '#FF1744',
  },
});
