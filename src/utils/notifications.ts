import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage keys ────────────────────────────────────────────
const NOTIFICATION_TIMES_KEY = 'notification_times';
const NOTIFICATION_FREQUENCY_KEY = 'notification_frequency';

// ─── Default notification times (hour, minute) ──────────────
export interface NotificationTime {
  hour: number;
  minute: number;
}

export const DEFAULT_TIMES: NotificationTime[] = [
  { hour: 9, minute: 0 },    // 9:00 AM
  { hour: 18, minute: 30 },  // 6:30 PM
];

// ─── Motivational messages ──────────────────────────────────
const MORNING_MESSAGES = [
  { title: '🌅 Good morning!', body: "Let's make progress on your goal today." },
  { title: '☀️ Rise and grind!', body: 'Your roadmap is waiting for you.' },
  { title: '🎯 New day, new progress!', body: 'Time to move closer to your goal.' },
  { title: '💪 You got this!', body: "Check in on your goal and keep the streak alive." },
  { title: '🚀 Ready to crush it?', body: 'Open your roadmap and take the next step.' },
];

const EVENING_MESSAGES = [
  { title: '🌙 Evening check-in', body: 'How did your goal progress go today?' },
  { title: '📊 Time to reflect', body: "Update your progress before the day ends." },
  { title: '✨ Almost done for today!', body: "Don't forget to log your progress." },
  { title: '🏆 End of day review', body: 'Take a moment to see how far you\'ve come.' },
  { title: '🔔 Quick reminder', body: 'Have you checked off any milestones today?' },
];

const RANDOM_CHECKIN_MESSAGES = [
  { title: '👋 Quick check-in', body: 'How are things going with your goal?' },
  { title: '💡 Stay on track!', body: 'A small step now makes a big difference later.' },
  { title: '🎯 Focus time', body: 'Take 5 minutes to review your roadmap.' },
  { title: '⚡ Momentum matters', body: "Keep the energy going — you're doing great!" },
  { title: '🌟 You\'re making progress!', body: 'Every step counts. Keep it up!' },
  { title: '📈 Climbing higher', body: 'Your consistency is what sets you apart.' },
  { title: '🔥 Don\'t break the streak!', body: 'Open your roadmap and stay motivated.' },
];

// ─── Pick a random message ──────────────────────────────────
function randomMessage(messages: { title: string; body: string }[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Setup notification handler (call once at app root) ─────
export function setupNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Request permissions ────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Goal Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5C518',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('checkins', {
      name: 'Check-in Nudges',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#F5C518',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Save / load notification times ─────────────────────────
export async function saveNotificationTimes(times: NotificationTime[]): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_TIMES_KEY, JSON.stringify(times));
}

export async function getNotificationTimes(): Promise<NotificationTime[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_TIMES_KEY);
    if (raw) return JSON.parse(raw) as NotificationTime[];
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_TIMES;
}

// ─── Save / load notification frequency ─────────────────────
export async function saveNotificationFrequency(freq: 'daily' | 'weekly'): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_FREQUENCY_KEY, freq);
}

export async function getNotificationFrequency(): Promise<'daily' | 'weekly'> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_FREQUENCY_KEY);
    if (raw === 'daily' || raw === 'weekly') return raw;
  } catch {
    // Fall through to default
  }
  return 'daily';
}

// ─── Cancel all scheduled notifications ─────────────────────
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Schedule all reminders ─────────────────────────────────
export async function scheduleReminders(
  frequency?: 'daily' | 'weekly' | 'none' | string | null,
  goalTitle?: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel existing
  await cancelAllReminders();

  // Normalize frequency — "none" is treated as daily (notifications are mandatory)
  const freq = (frequency === 'weekly') ? 'weekly' : 'daily';

  // Get user's preferred times (or defaults)
  const times = await getNotificationTimes();

  if (freq === 'daily') {
    // ── Schedule fixed-time daily reminders ──
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const isMorning = time.hour < 14;
      const msg = randomMessage(isMorning ? MORNING_MESSAGES : EVENING_MESSAGES);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: goalTitle ? `${msg.body} — "${goalTitle}"` : msg.body,
          data: { url: '/roadmap', type: 'reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
          channelId: 'reminders',
        },
      });
    }

    // ── Schedule random check-in nudges (hidden from settings) ──
    // 3 random check-ins spread through the day (between 8am and 9pm)
    const checkInHours = generateRandomCheckInHours(times, 3);
    for (const hour of checkInHours) {
      const msg = randomMessage(RANDOM_CHECKIN_MESSAGES);
      const randomMinute = Math.floor(Math.random() * 60);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: goalTitle ? `${msg.body} — "${goalTitle}"` : msg.body,
          data: { url: '/roadmap', type: 'checkin' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: randomMinute,
          channelId: 'checkins',
        },
      });
    }
  } else {
    // ── Weekly: schedule for Monday at each preferred time ──
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const isMorning = time.hour < 14;
      const msg = randomMessage(isMorning ? MORNING_MESSAGES : EVENING_MESSAGES);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: goalTitle ? `${msg.body} — "${goalTitle}"` : msg.body,
          data: { url: '/roadmap', type: 'reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 2, // Monday (1=Sunday, 2=Monday)
          hour: time.hour,
          minute: time.minute,
          channelId: 'reminders',
        },
      });
    }

    // Even on weekly, schedule light daily check-ins so the user
    // still gets nudges throughout the week
    const weeklyCheckIns = generateRandomCheckInHours(times, 2);
    for (const hour of weeklyCheckIns) {
      const msg = randomMessage(RANDOM_CHECKIN_MESSAGES);
      const randomMinute = Math.floor(Math.random() * 60);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: goalTitle ? `${msg.body} — "${goalTitle}"` : msg.body,
          data: { url: '/roadmap', type: 'checkin' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: randomMinute,
          channelId: 'checkins',
        },
      });
    }
  }

  // Save frequency locally
  await saveNotificationFrequency(freq);
}

// ─── Generate random check-in hours avoiding user's scheduled times ──
function generateRandomCheckInHours(
  existingTimes: NotificationTime[],
  count: number = 3,
): number[] {
  const existingHours = new Set(existingTimes.map((t) => t.hour));
  // Available hours: 8am to 9pm, excluding hours adjacent to user's scheduled times
  const availableHours: number[] = [];
  for (let h = 8; h <= 21; h++) {
    if (!existingHours.has(h) && !existingHours.has(h - 1) && !existingHours.has(h + 1)) {
      availableHours.push(h);
    }
  }

  // Pick `count` random hours, spaced at least 2 hours apart
  const numToPick = Math.min(count, availableHours.length);
  const selected: number[] = [];
  const pool = [...availableHours];
  for (let i = 0; i < numToPick; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    // Remove nearby hours to spread them out
    const chosen = pool[idx];
    const filtered = pool.filter((h) => Math.abs(h - chosen) > 2);
    pool.length = 0;
    pool.push(...filtered);
  }

  return selected.sort((a, b) => a - b);
}

// ─── Format time for display ────────────────────────────────
export function formatTime(time: NotificationTime): string {
  const h = time.hour % 12 || 12;
  const m = time.minute.toString().padStart(2, '0');
  const ampm = time.hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}
