import React, { useState } from 'react';
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
} from '@/types/goal';

type GoalType = 'numerical' | 'custom';

export default function CreateScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('numerical');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('$');

  // Custom milestones (start with 5 empty)
  const [customMilestones, setCustomMilestones] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
  ]);

  // ─── Handlers ──────────────────────────────────────────
  function addMilestone() {
    setCustomMilestones((prev) => [...prev, '']);
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
      prev.map((m, i) => (i === index ? text : m)),
    );
  }

  async function handleCreate() {
    // Validate title
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please give your goal a name.');
      return;
    }

    if (goalType === 'numerical') {
      const target = parseFloat(targetValue);
      if (isNaN(target) || target <= 0) {
        Alert.alert('Invalid Target', 'Please enter a valid target number.');
        return;
      }

      const goal: Goal = {
        id: generateId(),
        title: title.trim(),
        type: 'numerical',
        targetValue: target,
        currentValue: 0,
        unit: unit.trim(),
        milestones: generateNumericalMilestones(target, unit.trim()),
        createdAt: new Date().toISOString(),
      };

      await saveGoal(goal);
      router.replace('/roadmap' as Href);
    } else {
      // Custom goal
      const validMilestones = customMilestones.filter((m) => m.trim());
      if (validMilestones.length < 5) {
        Alert.alert(
          'Need More Milestones',
          'Please add at least 5 milestones with labels.',
        );
        return;
      }

      const milestones: Milestone[] = validMilestones.map((label) => ({
        id: generateId(),
        label: label.trim(),
        completed: false,
      }));

      const goal: Goal = {
        id: generateId(),
        title: title.trim(),
        type: 'custom',
        currentValue: 0,
        milestones,
        createdAt: new Date().toISOString(),
      };

      await saveGoal(goal);
      router.replace('/roadmap' as Href);
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
                Add at least 5 milestones for your journey
              </Text>

              {customMilestones.map((label, index) => (
                <View key={index} style={styles.milestoneRow}>
                  <View style={styles.milestoneNumber}>
                    <Text style={styles.milestoneNumberText}>
                      {index + 1}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.milestoneInput}
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
    backgroundColor: 'rgba(80,200,120,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(80,200,120,0.15)',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(80,200,120,0.8)',
    lineHeight: 18,
  },

  // Milestone rows
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
    backgroundColor: 'rgba(80,200,120,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#50C878',
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
