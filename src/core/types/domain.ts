export type PriorityLevel = 'P0' | 'P1' | 'P2';

export type TaskStatus =
  | 'backlog'
  | 'committed'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'deferred'
  | 'abandoned';

export type FrictionCategory =
  | 'TOO_BIG'
  | 'DONT_KNOW_HOW'
  | 'AVOIDING_IT'
  | 'INTERRUPTED'
  | 'UNDERESTIMATED'
  | 'NOT_IMPORTANT'
  | 'OTHER';

export interface Area {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Objective {
  id: string;
  areaId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

export interface Project {
  id: string;
  areaId?: string;
  objectiveId?: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived'; // Only 'active' counts toward WIP limit
  createdAt: string;
  activatedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  microAction?: string; // Very first 2-minute physical micro-action to break start resistance
  estimatedMinutes?: number; // 15, 30, 45, 60, 90, 120
  areaId?: string;
  projectId?: string;
  priority: PriorityLevel;
  
  // Execution tracking
  plannedStart?: string; // ISO string e.g. "2026-09-24T10:00:00"
  actualStart?: string;
  completedAt?: string;
  actualDurationSeconds: number;
  deferralCount: number; // Increments every time it is deferred across days
  
  // Status and evidence
  status: TaskStatus;
  evidenceNote?: string; // Optional manual proof/note
  lastFrictionReason?: FrictionCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CommittedTaskItem {
  taskId: string;
  priority: PriorityLevel;
  originalIndex: number;
  completed: boolean;
  deferred: boolean;
  wasChanged: boolean;
  changeReason?: string;
  changedAt?: string;
}

export interface DailyCommitment {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  isLocked: boolean;
  lockedAt?: string;
  tasks: CommittedTaskItem[];
  reconciledAt?: string; // Set during Evening Close
  createdAt: string;
  updatedAt: string;
}

export interface NoveltyCapture {
  id: string;
  content: string;
  capturedAt: string;
  status: 'unprocessed' | 'promoted_to_task' | 'dismissed';
  promotedTaskId?: string;
}

export interface UserPreferences {
  wipProjectLimit: number; // default: 5
  startDelayThresholdMinutes: number; // default: 15
  underestimateRatioThreshold: number; // default: 1.5
  deferralThreshold: number; // default: 3
}

export interface UserProfile {
  id: string;
  name: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
}

