import { supabase } from '@/lib/supabase';
import type { Goal } from '../types/goal';

/** Save a new goal to Supabase */
export async function saveGoal(goal: Goal): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Don't send `id` — let Postgres auto-generate the UUID
  const { data: inserted, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: goal.title,
      type: goal.type,
      target_value: goal.targetValue ?? null,
      current_value: goal.currentValue,
      unit: goal.unit ?? null,
      start_weight: goal.startWeight ?? null,
      target_weight: goal.targetWeight ?? null,
      milestones: goal.milestones,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Update the goal object with the Supabase-generated UUID
  if (inserted) {
    goal.id = inserted.id;
  }

  // Increment total_goals_created on profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_goals_created')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        total_goals_created: (profile.total_goals_created || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }
}

/** Get the current active goal, or null if none exists */
export async function getGoal(): Promise<Goal | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return mapRowToGoal(data);
}

/** Update the current goal */
export async function updateGoal(goal: Goal): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({
      title: goal.title,
      target_value: goal.targetValue ?? null,
      current_value: goal.currentValue,
      unit: goal.unit ?? null,
      start_weight: goal.startWeight ?? null,
      target_weight: goal.targetWeight ?? null,
      milestones: goal.milestones,
    })
    .eq('id', goal.id);

  if (error) throw error;
}

/** Delete the current goal */
export async function deleteGoal(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Delete the most recent active goal
  const { data } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    await supabase.from('goals').delete().eq('id', data.id);
  }
}

// ─── History ─────────────────────────────────────────────────

/** Get all archived (past) goals */
export async function getHistory(): Promise<Goal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', false)
    .order('completed_at', { ascending: false });

  if (error || !data) return [];

  return data.map(mapRowToGoal);
}

/** Archive a goal to history */
export async function archiveGoal(goal: Goal): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({
      is_active: false,
      completed_at: goal.completedAt || new Date().toISOString(),
      current_value: goal.currentValue,
      milestones: goal.milestones,
    })
    .eq('id', goal.id);

  if (error) throw error;
}

/** Get a single archived goal by ID */
export async function getArchivedGoal(goalId: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .maybeSingle();

  if (error || !data) return null;

  return mapRowToGoal(data);
}

// ─── Helper ──────────────────────────────────────────────────

function mapRowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as 'numerical' | 'custom',
    targetValue: row.target_value != null ? Number(row.target_value) : undefined,
    currentValue: Number(row.current_value ?? 0),
    unit: (row.unit as string) ?? undefined,
    startWeight: row.start_weight != null ? Number(row.start_weight) : undefined,
    targetWeight: row.target_weight != null ? Number(row.target_weight) : undefined,
    milestones: (row.milestones as Goal['milestones']) ?? [],
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  };
}
