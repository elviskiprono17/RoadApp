import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal } from '../types/goal';

const GOAL_KEY = '@roadapp_current_goal';

/** Save or overwrite the current goal */
export async function saveGoal(goal: Goal): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

/** Get the current goal, or null if none exists */
export async function getGoal(): Promise<Goal | null> {
  try {
    const data = await AsyncStorage.getItem(GOAL_KEY);
    return data ? (JSON.parse(data) as Goal) : null;
  } catch {
    return null;
  }
}

/** Update the current goal */
export async function updateGoal(goal: Goal): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

/** Delete the current goal */
export async function deleteGoal(): Promise<void> {
  await AsyncStorage.removeItem(GOAL_KEY);
}
