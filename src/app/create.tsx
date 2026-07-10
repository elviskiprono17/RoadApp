import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveGoal } from '@/storage/goalStorage';
import {
  generateId,
  generateNumericalMilestones,
  type Goal,
  type Milestone,
  type SubMilestone,
} from '@/types/goal';
import { useAuth } from '@/context/AuthContext';

type GoalType = 'numerical' | 'custom';

interface CustomMilestoneData {
  label: string;
  subMilestones: string[];
  expanded: boolean;
}

export default function CreateScreen() {
  const router = useRouter();
  const { canCreateGoal, refreshProfile } = useAuth();

  // Guard: redirect to paywall if free limit hit
  useEffect(() => {
    if (!canCreateGoal) {
      router.replace('/paywall' as Href);
    }
  }, [canCreateGoal]);

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('numerical');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('$');

  // Custom milestones (start with 5 empty, each with sub-milestone support)
  const [customMilestones, setCustomMilestones] = useState<CustomMilestoneData[]>(
    Array.from({ length: 5 }, () => ({
      label: '',
      subMilestones: [],
      expanded: false,
    })),
  );

  // ─── Handlers ──────────────────────────────────────────
  function addMilestone() {
    setCustomMilestones((prev) => [
      ...prev,
      { label: '', subMilestones: [], expanded: false },
    ]);
  }

  function removeMilestone(index: number) {
    if (customMilestones.length <= 5) {
      Alert.alert('Minimum', 'You need at least 5 milestones.');
      return;
    }
    setCustomMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMilestoneLabel(index: number, text: string) {
    setCustomMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, label: text } : m)),
    );
  }

  function toggleMilestoneExpanded(index: number) {
    setCustomMilestones((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, expanded: !m.expanded } : m,
      ),
    );
  }

  function addSubMilestone(milestoneIndex: number) {
    setCustomMilestones((prev) =>
      prev.map((m, i) =>
        i === milestoneIndex
          ? { ...m, subMilestones: [...m.subMilestones, ''], expanded: true }
          : m,
      ),
    );
  }

  function removeSubMilestone(milestoneIndex: number, subIndex: number) {
    setCustomMilestones((prev) =>
      prev.map((m, i) =>
        i === milestoneIndex
          ? {
              ...m,
              subMilestones: m.subMilestones.filter((_, si) => si !== subIndex),
            }
          : m,
      ),
    );
  }

  function updateSubMilestoneLabel(
    milestoneIndex: number,
    subIndex: number,
    text: string,
  ) {
    setCustomMilestones((prev) =>
      prev.map((m, i) =>
        i === milestoneIndex
          ? {
              ...m,
              subMilestones: m.subMilestones.map((s, si) =>
                si === subIndex ? text : s,
              ),
            }
          : m,
      ),
    );
  }

  async function handleCreate() {
    // Validate title
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please give your goal a name.');
      return;
    }

    try {
      if (goalType === 'numerical') {
        const target = parseFloat(targetValue);
        if (isNaN(target) || target <= 0) {
          Alert.alert('Invalid Target', 'Please enter a valid target number.');
          return;
        }

        const goal: Goal = {
          id: generateId(), // placeholder — Supabase generates real UUID
          title: title.trim(),
          type: 'numerical',
          targetValue: target,
          currentValue: 0,
          unit: unit.trim(),
          milestones: generateNumericalMilestones(target, unit.trim()),
          createdAt: new Date().toISOString(),
        };

        await saveGoal(goal);
        await refreshProfile();
        router.replace('/roadmap' as Href);
      } else {
        // Custom goal
        const validMilestones = customMilestones.filter((m) => m.label.trim());
        if (validMilestones.length < 5) {
          Alert.alert(
            'Need More Milestones',
            'Please add at least 5 milestones with labels.',
          );
          return;
        }

        const milestones: Milestone[] = validMilestones.map((m) => {
          const validSubs = m.subMilestones.filter((s) => s.trim());
          const subMilestones: SubMilestone[] = validSubs.map((s) => ({
            id: generateId(),
            label: s.trim(),
            completed: false,
          }));

          return {
            id: generateId(),
            label: m.label.trim(),
            completed: false,
            ...(subMilestones.length > 0 ? { subMilestones } : {}),
          };
        });

        const goal: Goal = {
          id: generateId(), // placeholder — Supabase generates real UUID
          title: title.trim(),
          type: 'custom',
          currentValue: 0,
          milestones,
          createdAt: new Date().toISOString(),
        };

        await saveGoal(goal);
        await refreshProfile();
        router.replace('/roadmap' as Href);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong saving your goal.';
      Alert.alert('Error', message);
    }
  }

  // ─── Unit options ──────────────────────────────────────
  const units = ['$', '€', '£', 'kg', 'lbs', 'km', 'mi', 'hrs', ''];

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
          <Text style={styles.headerTitle}>New Goal</Text>
          <View style={{ width: 60 }} />
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
            placeholder="e.g. Learn Swahili, Save $5000"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoFocus
          />

          {/* Type Selector */}
          <Text style={styles.label}>Goal Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                goalType === 'numerical' && styles.typeOptionActive,
              ]}
              onPress={() => setGoalType('numerical')}
            >
              <Text style={styles.typeEmoji}>🔢</Text>
              <Text
                style={[
                  styles.typeText,
                  goalType === 'numerical' && styles.typeTextActive,
                ]}
              >
                Numerical
              </Text>
              <Text style={styles.typeDescription}>
                Money, weight, distance…
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                goalType === 'custom' && styles.typeOptionActive,
              ]}
              onPress={() => setGoalType('custom')}
            >
              <Text style={styles.typeEmoji}>📝</Text>
              <Text
                style={[
                  styles.typeText,
                  goalType === 'custom' && styles.typeTextActive,
                ]}
              >
                Custom
              </Text>
              <Text style={styles.typeDescription}>
                Skills, habits, projects…
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Numerical Fields ── */}
          {goalType === 'numerical' && (
            <View style={styles.section}>
              <Text style={styles.label}>Target Value</Text>
              <TextInput
                style={styles.input}
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="e.g. 5000"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="numeric"
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
                  📊 10 milestones will be auto-generated from 0 to{' '}
                  {unit}
                  {targetValue || '0'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Custom Milestones ── */}
          {goalType === 'custom' && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Milestones ({customMilestones.length})
              </Text>
              <Text style={styles.sublabel}>
                Add at least 5 milestones for your journey. Tap ▾ to add sub-goals.
              </Text>

              {customMilestones.map((milestone, index) => (
                <View key={index} style={styles.milestoneBlock}>
                  {/* Main milestone row */}
                  <View style={styles.milestoneRow}>
                    <View style={styles.milestoneNumber}>
                      <Text style={styles.milestoneNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.milestoneInput}
                      value={milestone.label}
                      onChangeText={(text) =>
                        updateMilestoneLabel(index, text)
                      }
                      placeholder={`Milestone ${index + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                    <TouchableOpacity
                      onPress={() => toggleMilestoneExpanded(index)}
                      style={styles.expandButton}
                    >
                      <Text style={styles.expandButtonText}>
                        {milestone.expanded ? '▴' : '▾'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeMilestone(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sub-milestones section */}
                  {milestone.expanded && (
                    <View style={styles.subMilestoneContainer}>
                      {milestone.subMilestones.map((subLabel, subIndex) => (
                        <View key={subIndex} style={styles.subMilestoneRow}>
                          <View style={styles.subMilestoneConnector}>
                            <View style={styles.subConnectorLine} />
                            <View style={styles.subConnectorDot} />
                          </View>
                          <TextInput
                            style={styles.subMilestoneInput}
                            value={subLabel}
                            onChangeText={(text) =>
                              updateSubMilestoneLabel(index, subIndex, text)
                            }
                            placeholder={`Sub-goal ${subIndex + 1}`}
                            placeholderTextColor="rgba(255,255,255,0.2)"
                          />
                          <TouchableOpacity
                            onPress={() =>
                              removeSubMilestone(index, subIndex)
                            }
                            style={styles.subRemoveButton}
                          >
                            <Text style={styles.subRemoveButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.addSubButton}
                        onPress={() => addSubMilestone(index)}
                      >
                        <Text style={styles.addSubButtonText}>
                          + Add Sub-goal
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addMilestoneButton}
                onPress={addMilestone}
              >
                <Text style={styles.addMilestoneText}>+ Add Milestone</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>Create Goal 🚀</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
  sublabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
    marginTop: -4,
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

  // Type selector
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.08)',
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 3,
  },
  typeTextActive: {
    color: '#F5C518',
  },
  typeDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },

  // Section
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

  // Info box
  infoBox: {
    backgroundColor: 'rgba(27,138,74,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(27,138,74,0.15)',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(27,138,74,0.8)',
    lineHeight: 18,
  },

  // Milestone block (contains main row + sub-milestones)
  milestoneBlock: {
    marginBottom: 10,
  },

  // Milestone rows
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27,138,74,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B8A4A',
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
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27,138,74,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#1B8A4A',
    fontSize: 16,
    fontWeight: '700',
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

  // Sub-milestone styles
  subMilestoneContainer: {
    marginLeft: 42,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(27,138,74,0.2)',
  },
  subMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  subMilestoneConnector: {
    width: 16,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subConnectorLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 12,
    width: 2,
    backgroundColor: 'rgba(27,138,74,0.2)',
  },
  subConnectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(27,138,74,0.4)',
  },
  subMilestoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subRemoveButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,23,68,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subRemoveButtonText: {
    color: '#FF1744',
    fontSize: 12,
    fontWeight: '700',
  },
  addSubButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(27,138,74,0.2)',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  addSubButtonText: {
    color: 'rgba(27,138,74,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Add milestone button
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

  // Bottom bar
  bottomBar: {
    backgroundColor: '#16213e',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  createButton: {
    backgroundColor: '#F5C518',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
  },
});
