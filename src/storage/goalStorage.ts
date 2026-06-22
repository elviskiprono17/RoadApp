import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal } from '../types/goal';

const GOAL_KEY = '@roadapp_current_goal';
const HISTORY_KEY = '@roadapp_goal_history';

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

// ─── History ─────────────────────────────────────────────────

/** Get all archived (past) goals */
export async function getHistory(): Promise<Goal[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? (JSON.parse(data) as Goal[]) : [];
  } catch {
    return [];
  }
}

/** Archive a goal to history */
export async function archiveGoal(goal: Goal): Promise<void> {
  const history = await getHistory();
  // Add completedAt if not already set
  const archivedGoal: Goal = {
    ...goal,
    completedAt: goal.completedAt || new Date().toISOString(),
  };
  // Avoid duplicates by id
  const filtered = history.filter((g) => g.id !== archivedGoal.id);
  filtered.push(archivedGoal);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

/** Get a single archived goal by ID */
export async function getArchivedGoal(goalId: string): Promise<Goal | null> {
  const history = await getHistory();
  return history.find((g) => g.id === goalId) || null;
}
