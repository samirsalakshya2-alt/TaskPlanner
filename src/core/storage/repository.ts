import {
  UserProfile,
  Area,
  Project,
  Task,
  DailyCommitment,
  NoveltyCapture,
  PriorityLevel,
  TaskStatus,
  FrictionCategory
} from '../types/domain';
import { DomainEvent, EventType } from '../types/events';

export interface IRepository {
  // Initialization & Startup
  initializeDefaults(): Promise<void>;

  // User Profile & Preferences
  getUserProfile(): Promise<UserProfile>;
  updateUserPreferences(preferences: Partial<UserProfile['preferences']>): Promise<void>;

  // Areas & Projects
  getAreas(): Promise<Area[]>;
  getProjects(): Promise<Project[]>;
  getActiveProjectCount(): Promise<number>;
  createProject(name: string, areaId?: string): Promise<Project>;
  updateProjectStatus(projectId: string, status: Project['status']): Promise<void>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;
  getBacklogTasks(): Promise<Task[]>;
  createTask(data: {
    title: string;
    microAction?: string;
    estimatedMinutes?: number;
    priority?: PriorityLevel;
    areaId?: string;
    projectId?: string;
    plannedStart?: string;
  }): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  deleteTask(id: string, reason?: string): Promise<void>;

  // Commitments & Lock Day
  getCommitmentForDate(date: string): Promise<DailyCommitment | undefined>;
  getOrCreateTodayCommitment(date: string): Promise<DailyCommitment>;
  setTodayCommitments(date: string, taskIds: { taskId: string; priority: PriorityLevel }[]): Promise<DailyCommitment>;
  lockDay(date: string): Promise<void>;
  alterLockedPlan(date: string, taskId: string, action: 'remove' | 'replace' | 'add', reason: string, replacementTaskId?: string): Promise<void>;
  
  // Execution & Observation
  startTask(taskId: string): Promise<{ startDelayMinutes: number }>;
  pauseTask(taskId: string, elapsedSeconds: number): Promise<void>;
  resumeTask(taskId: string): Promise<void>;
  completeTask(taskId: string, elapsedSeconds: number, evidenceNote?: string): Promise<void>;
  deferTask(taskId: string, reason: FrictionCategory, note?: string): Promise<void>;
  recordFriction(taskId: string, category: FrictionCategory, note?: string): Promise<void>;

  // Novelty Capture (Distraction Shield)
  captureNovelty(content: string): Promise<NoveltyCapture>;
  getUnprocessedNovelties(): Promise<NoveltyCapture[]>;
  promoteNoveltyToTask(noveltyId: string, taskTitle: string): Promise<Task>;
  dismissNovelty(noveltyId: string): Promise<void>;

  // Day Close Reconciliation
  reconcileDay(date: string, resolutions: {
    taskId: string;
    action: 'COMPLETE_NOW' | 'MOVE_TO_TOMORROW' | 'BREAK_DOWN' | 'DELETE';
    reason?: FrictionCategory | string;
    note?: string;
  }[]): Promise<void>;

  // Events & Metrics
  recordEvent(type: EventType, entityType: DomainEvent['entityType'], entityId: string, payload?: Record<string, any>): Promise<DomainEvent>;
  getEvents(limit?: number): Promise<DomainEvent[]>;
  getEventsForDate(date: string): Promise<DomainEvent[]>;
}

