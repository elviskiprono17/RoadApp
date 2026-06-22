export interface SubMilestone {
  id: string;
  label: string;
  completed: boolean;
}

export interface Milestone {
  id: string;
  label: string;
  completed: boolean;
  /** For numerical goals, the target value at this milestone */
  value?: number;
  /** Sub-goals under this milestone (custom goals only) */
  subMilestones?: SubMilestone[];
}

export interface Goal {
  id: string;
  title: string;
  type: 'numerical' | 'custom';
  /** Target value for numerical goals (e.g., 5000 for "$5000") */
  targetValue?: number;
  /** Current progress value for numerical goals */
  currentValue: number;
  /** Unit label for numerical goals (e.g., "$", "kg") */
  unit?: string;
  /** Ordered list of milestones */
  milestones: Milestone[];
  createdAt: string;
  /** ISO date when the goal was completed/archived */
  completedAt?: string;
}

/** Generate a simple unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/** Generate 10 evenly-spaced milestones for a numerical goal */
export function generateNumericalMilestones(targetValue: number, unit: string): Milestone[] {
  const milestones: Milestone[] = [];
  for (let i = 1; i <= 10; i++) {
    const value = Math.round((targetValue / 10) * i);
    milestones.push({
      id: generateId(),
      label: `${unit}${value.toLocaleString()}`,
      completed: false,
      value,
    });
  }
  return milestones;
}
