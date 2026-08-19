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
  Modal,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getGoal,
  updateGoal,
  deleteGoal,
} from '@/storage/goalStorage';
import { generateId, generateNumericalMilestones } from '@/types/goal';
import type { Goal } from '@/types/goal';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import {
  scheduleReminders,
  getNotificationTimes,
  saveNotificationTimes,
  formatTime,
  type NotificationTime,
  DEFAULT_TIMES,
} from '@/utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, isTrialActive, trialDaysLeft } = useAuth();
  const { isPremium } = useSubscription();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [milestoneLabels, setMilestoneLabels] = useState<string[]>([]);

  // Notification settings
  const [notifFrequency, setNotifFrequency] = useState<'daily' | 'weekly'>(
    (profile?.reminder_frequency as 'daily' | 'weekly') || 'daily',
  );
  const [notifTimes, setNotifTimes] = useState<NotificationTime[]>(DEFAULT_TIMES);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  useEffect(() => {
    loadGoal();
    loadNotificationSettings();
  }, []);

  async function loadNotificationSettings() {
    const times = await getNotificationTimes();
    setNotifTimes(times);
  }

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

          {/* ── Account ── */}
          <View style={styles.accountSection}>
            <Text style={styles.accountTitle}>Account</Text>

            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Email</Text>
                <Text style={styles.accountValue} numberOfLines={1}>
                  {user?.email || '—'}
                </Text>
              </View>
              <View style={styles.accountDivider} />
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Plan</Text>
                <View style={[
                  styles.planBadge,
                  isPremium && styles.planBadgePremium,
                ]}>
                  <Text style={[
                    styles.planBadgeText,
                    isPremium && styles.planBadgeTextPremium,
                  ]}>
                    {isPremium ? '⭐ Premium' : 'Free'}
                  </Text>
                </View>
              </View>
              {!isPremium && (
                <>
                  <View style={styles.accountDivider} />
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Trial</Text>
                    <Text style={[
                      styles.accountValue,
                      !isTrialActive && styles.accountValueExpired,
                    ]}>
                      {isTrialActive
                        ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`
                        : 'Expired'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeSettingsButton}
                onPress={() => router.push('/paywall' as Href)}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeSettingsText}>Upgrade to Premium 👑</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Notifications ── */}
          <View style={styles.notifSection}>
            <Text style={styles.notifSectionTitle}>Notifications</Text>

            {/* Frequency toggle */}
            <Text style={styles.notifLabel}>Reminder Frequency</Text>
            <View style={styles.notifFreqRow}>
              {(['daily', 'weekly'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.notifFreqChip,
                    notifFrequency === freq && styles.notifFreqChipActive,
                  ]}
                  onPress={async () => {
                    setNotifFrequency(freq);
                    // Update Supabase
                    if (user) {
                      await supabase
                        .from('profiles')
                        .update({
                          reminder_frequency: freq,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', user.id);
                    }
                    // Reschedule
                    await scheduleReminders(freq, goal?.title);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.notifFreqIcon}>
                    {freq === 'daily' ? '🔔' : '📆'}
                  </Text>
                  <Text
                    style={[
                      styles.notifFreqText,
                      notifFrequency === freq && styles.notifFreqTextActive,
                    ]}
                  >
                    {freq === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                  {notifFrequency === freq && (
                    <View style={styles.notifFreqCheck}>
                      <Text style={styles.notifFreqCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Notification times */}
            <Text style={[styles.notifLabel, { marginTop: 20 }]}>Reminder Times</Text>
            <View style={styles.notifTimesCard}>
              {notifTimes.map((time, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.notifTimeDivider} />}
                  <View style={styles.notifTimeRow}>
                    <View style={styles.notifTimeLeft}>
                      <Text style={styles.notifTimeIcon}>
                        {time.hour < 12 ? '🌅' : time.hour < 17 ? '☀️' : '🌙'}
                      </Text>
                      <View>
                        <Text style={styles.notifTimeValue}>{formatTime(time)}</Text>
                        <Text style={styles.notifTimeLabel}>
                          {time.hour < 12 ? 'Morning' : time.hour < 17 ? 'Afternoon' : 'Evening'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.notifTimeActions}>
                      <TouchableOpacity
                        style={styles.notifTimeEditBtn}
                        onPress={() => {
                          setEditingTimeIndex(index);
                          setTempHour(time.hour);
                          setTempMinute(time.minute);
                          setShowTimePicker(true);
                        }}
                      >
                        <Text style={styles.notifTimeEditText}>Edit</Text>
                      </TouchableOpacity>
                      {notifTimes.length > 1 && (
                        <TouchableOpacity
                          style={styles.notifTimeRemoveBtn}
                          onPress={async () => {
                            const updated = notifTimes.filter((_, i) => i !== index);
                            setNotifTimes(updated);
                            await saveNotificationTimes(updated);
                            await scheduleReminders(notifFrequency, goal?.title);
                          }}
                        >
                          <Text style={styles.notifTimeRemoveText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {notifTimes.length < 4 && (
              <TouchableOpacity
                style={styles.notifAddTimeBtn}
                onPress={() => {
                  setEditingTimeIndex(null);
                  setTempHour(12);
                  setTempMinute(0);
                  setShowTimePicker(true);
                }}
              >
                <Text style={styles.notifAddTimeText}>+ Add Reminder Time</Text>
              </TouchableOpacity>
            )}

            <View style={styles.notifInfoBox}>
              <Text style={styles.notifInfoText}>
                💡 You'll also receive random motivational check-ins between your scheduled times.
              </Text>
            </View>
          </View>

          {/* ── Time Picker Modal ── */}
          <Modal
            visible={showTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingTimeIndex !== null ? 'Edit Reminder Time' : 'Add Reminder Time'}
                </Text>

                <View style={styles.timePickerRow}>
                  {/* Hour */}
                  <View style={styles.timePickerCol}>
                    <Text style={styles.timePickerLabel}>Hour</Text>
                    <View style={styles.timePickerControls}>
                      <TouchableOpacity
                        style={styles.timePickerBtn}
                        onPress={() => setTempHour((h) => (h + 1) % 24)}
                      >
                        <Text style={styles.timePickerBtnText}>▲</Text>
                      </TouchableOpacity>
                      <Text style={styles.timePickerValue}>
                        {(tempHour % 12 || 12).toString()}
                      </Text>
                      <TouchableOpacity
                        style={styles.timePickerBtn}
                        onPress={() => setTempHour((h) => (h - 1 + 24) % 24)}
                      >
                        <Text style={styles.timePickerBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.timePickerColon}>:</Text>

                  {/* Minute */}
                  <View style={styles.timePickerCol}>
                    <Text style={styles.timePickerLabel}>Min</Text>
                    <View style={styles.timePickerControls}>
                      <TouchableOpacity
                        style={styles.timePickerBtn}
                        onPress={() => setTempMinute((m) => (m + 5) % 60)}
                      >
                        <Text style={styles.timePickerBtnText}>▲</Text>
                      </TouchableOpacity>
                      <Text style={styles.timePickerValue}>
                        {tempMinute.toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        style={styles.timePickerBtn}
                        onPress={() => setTempMinute((m) => (m - 5 + 60) % 60)}
                      >
                        <Text style={styles.timePickerBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* AM/PM */}
                  <View style={styles.timePickerCol}>
                    <Text style={styles.timePickerLabel}> </Text>
                    <View style={styles.timePickerControls}>
                      <TouchableOpacity
                        style={[
                          styles.ampmBtn,
                          tempHour < 12 && styles.ampmBtnActive,
                        ]}
                        onPress={() => {
                          if (tempHour >= 12) setTempHour(tempHour - 12);
                        }}
                      >
                        <Text
                          style={[
                            styles.ampmText,
                            tempHour < 12 && styles.ampmTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.ampmBtn,
                          tempHour >= 12 && styles.ampmBtnActive,
                        ]}
                        onPress={() => {
                          if (tempHour < 12) setTempHour(tempHour + 12);
                        }}
                      >
                        <Text
                          style={[
                            styles.ampmText,
                            tempHour >= 12 && styles.ampmTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.timePreview}>
                  {formatTime({ hour: tempHour, minute: tempMinute })}
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={async () => {
                      const newTime = { hour: tempHour, minute: tempMinute };
                      let updated: NotificationTime[];
                      if (editingTimeIndex !== null) {
                        updated = notifTimes.map((t, i) =>
                          i === editingTimeIndex ? newTime : t,
                        );
                      } else {
                        updated = [...notifTimes, newTime];
                      }
                      // Sort by time
                      updated.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
                      setNotifTimes(updated);
                      await saveNotificationTimes(updated);
                      await scheduleReminders(notifFrequency, goal?.title);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.modalSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
    color: '#50C878',
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
    backgroundColor: 'rgba(80,200,120,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberCompleted: {
    backgroundColor: 'rgba(120,144,156,0.2)',
  },
  milestoneNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#50C878',
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

  // Account section
  accountSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 20,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accountCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
  },
  accountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  accountValueExpired: {
    color: '#FF6B6B',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  planBadgePremium: {
    backgroundColor: 'rgba(245,197,24,0.15)',
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  planBadgeTextPremium: {
    color: '#F5C518',
  },
  upgradeSettingsButton: {
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.15)',
  },
  upgradeSettingsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5C518',
  },

  // ─── Notification settings ─────────────────────────────────
  notifSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 20,
  },
  notifSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notifLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  notifFreqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notifFreqChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  notifFreqChipActive: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.06)',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  notifFreqIcon: {
    fontSize: 20,
  },
  notifFreqText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  notifFreqTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notifFreqCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifFreqCheckText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  notifTimesCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notifTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  notifTimeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 14,
  },
  notifTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifTimeIcon: {
    fontSize: 24,
  },
  notifTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  notifTimeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTimeEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(245,197,24,0.1)',
  },
  notifTimeEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5C518',
  },
  notifTimeRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,23,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTimeRemoveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF1744',
  },
  notifAddTimeBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  notifAddTimeText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontWeight: '600',
  },
  notifInfoBox: {
    backgroundColor: 'rgba(245,197,24,0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.1)',
  },
  notifInfoText: {
    fontSize: 13,
    color: 'rgba(245,197,24,0.7)',
    lineHeight: 18,
  },

  // ─── Time Picker Modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  timePickerCol: {
    alignItems: 'center',
    gap: 4,
  },
  timePickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timePickerControls: {
    alignItems: 'center',
    gap: 6,
  },
  timePickerBtn: {
    width: 48,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  timePickerValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    minWidth: 48,
    textAlign: 'center',
  },
  timePickerColon: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 20,
  },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ampmBtnActive: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.1)',
  },
  ampmText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  ampmTextActive: {
    color: '#F5C518',
  },
  timePreview: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
});
