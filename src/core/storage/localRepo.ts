import { db } from './db';
import { IRepository } from './repository';
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

const DEFAULT_USER_ID = 'local-user';

export class LocalRepository implements IRepository {
  async initializeDefaults(): Promise<void> {
    const existing = await db.users.get(DEFAULT_USER_ID);
    if (!existing) {
      const user: UserProfile = {
        id: DEFAULT_USER_ID,
        name: 'Operator',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        preferences: {
          wipProjectLimit: 5,
          startDelayThresholdMinutes: 15,
          underestimateRatioThreshold: 1.5,
          deferralThreshold: 3
        },
        createdAt: new Date().toISOString()
      };
      await db.users.put(user);
    }

    // Seed initial areas if empty
    const areaCount = await db.areas.count();
    if (areaCount === 0) {
      const defaultAreas: Area[] = [
        { id: 'area-work', name: 'Work & Career', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: 'area-personal', name: 'Personal & Home', color: '#10b981', createdAt: new Date().toISOString() },
        { id: 'area-learning', name: 'Learning & Craft', color: '#8b5cf6', createdAt: new Date().toISOString() },
        { id: 'area-health', name: 'Health & Vitality', color: '#f59e0b', createdAt: new Date().toISOString() }
      ];
      await db.areas.bulkPut(defaultAreas);
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const existing = await db.users.get(DEFAULT_USER_ID);
    if (existing) return existing;
    return {
      id: DEFAULT_USER_ID,
      name: 'Operator',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      preferences: {
        wipProjectLimit: 5,
        startDelayThresholdMinutes: 15,
        underestimateRatioThreshold: 1.5,
        deferralThreshold: 3
      },
      createdAt: new Date().toISOString()
    };
  }

  async updateUserPreferences(preferences: Partial<UserProfile['preferences']>): Promise<void> {
    const user = await this.getUserProfile();
    const updated: UserProfile = {
      ...user,
      preferences: { ...user.preferences, ...preferences }
    };
    await db.users.put(updated);
  }

  async getAreas(): Promise<Area[]> {
    return db.areas.toArray();
  }

  async getProjects(): Promise<Project[]> {
    return db.projects.toArray();
  }

  async getActiveProjectCount(): Promise<number> {
    return db.projects.where('status').equals('active').count();
  }

  async createProject(name: string, areaId?: string): Promise<Project> {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      areaId,
      status: 'active',
      activatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await db.projects.put(project);
    await this.recordEvent('PROJECT_WIP_CHANGED', 'project', project.id, { action: 'created', name });
    return project;
  }

  async updateProjectStatus(projectId: string, status: Project['status']): Promise<void> {
    const project = await db.projects.get(projectId);
    if (!project) return;
    const now = new Date().toISOString();
    const updates: Partial<Project> = { status };
    if (status === 'active') updates.activatedAt = now;
    if (status === 'paused') updates.pausedAt = now;
    if (status === 'completed') updates.completedAt = now;

    await db.projects.update(projectId, updates);
    await this.recordEvent('PROJECT_WIP_CHANGED', 'project', projectId, { status, previousStatus: project.status });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return db.tasks.where('status').equals(status).toArray();
  }

  async getBacklogTasks(): Promise<Task[]> {
    return db.tasks.where('status').anyOf('backlog', 'deferred').toArray();
  }

  async createTask(data: {
    title: string;
    microAction?: string;
    estimatedMinutes?: number;
    priority?: PriorityLevel;
    areaId?: string;
    projectId?: string;
    plannedStart?: string;
  }): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      microAction: data.microAction?.trim(),
      estimatedMinutes: data.estimatedMinutes,
      priority: data.priority || 'P1',
      areaId: data.areaId,
      projectId: data.projectId,
      plannedStart: data.plannedStart,
      status: 'backlog',
      actualDurationSeconds: 0,
      deferralCount: 0,
      createdAt: now,
      updatedAt: now
    };

    await db.tasks.put(task);
    await this.recordEvent('TASK_CREATED', 'task', task.id, {
      title: task.title,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes
    });
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const task = await db.tasks.get(id);
    if (!task) return;
    const now = new Date().toISOString();
    await db.tasks.update(id, { ...updates, updatedAt: now });
    await this.recordEvent('TASK_EDITED', 'task', id, updates);
  }

  async deleteTask(id: string, reason?: string): Promise<void> {
    await db.tasks.delete(id);
    await this.recordEvent('TASK_DELETED', 'task', id, { reason });
  }

  async getCommitmentForDate(date: string): Promise<DailyCommitment | undefined> {
    return db.commitments.get(date);
  }

  async getOrCreateTodayCommitment(date: string): Promise<DailyCommitment> {
    const existing = await db.commitments.get(date);
    if (existing) return existing;

    const now = new Date().toISOString();
    const newCommitment: DailyCommitment = {
      id: date,
      date,
      isLocked: false,
      tasks: [],
      createdAt: now,
      updatedAt: now
    };
    await db.commitments.put(newCommitment);
    return newCommitment;
  }

  async setTodayCommitments(date: string, items: { taskId: string; priority: PriorityLevel }[]): Promise<DailyCommitment> {
    const existing = await this.getOrCreateTodayCommitment(date);
    if (existing.isLocked) {
      throw new Error('Cannot replace commitments directly on a locked day. Use alterLockedPlan.');
    }

    const now = new Date().toISOString();
    const tasks: DailyCommitment['tasks'] = items.map((item, idx) => ({
      taskId: item.taskId,
      priority: item.priority,
      originalIndex: idx,
      completed: false,
      deferred: false,
      wasChanged: false
    }));

    const updated: DailyCommitment = {
      ...existing,
      tasks,
      updatedAt: now
    };

    // Update task statuses to 'committed'
    await db.transaction('rw', db.commitments, db.tasks, async () => {
      await db.commitments.put(updated);
      for (const item of items) {
        await db.tasks.update(item.taskId, {
          status: 'committed',
          priority: item.priority,
          updatedAt: now
        });
      }
    });

    await this.recordEvent('TASK_COMMITTED', 'commitment', date, { count: items.length, items });
    return updated;
  }

  async lockDay(date: string): Promise<void> {
    const commitment = await this.getOrCreateTodayCommitment(date);
    const now = new Date().toISOString();
    const updated: DailyCommitment = {
      ...commitment,
      isLocked: true,
      lockedAt: now,
      updatedAt: now
    };
    await db.commitments.put(updated);
    await this.recordEvent('DAY_LOCKED', 'day', date, {
      lockedAt: now,
      taskCount: commitment.tasks.length
    });
  }

  async alterLockedPlan(
    date: string,
    taskId: string,
    action: 'remove' | 'replace' | 'add',
    reason: string,
    replacementTaskId?: string
  ): Promise<void> {
    const commitment = await db.commitments.get(date);
    if (!commitment) return;
    const now = new Date().toISOString();

    let updatedTasks = [...commitment.tasks];
    if (action === 'remove') {
      const idx = updatedTasks.findIndex(t => t.taskId === taskId);
      if (idx !== -1) {
        updatedTasks[idx] = {
          ...updatedTasks[idx],
          wasChanged: true,
          changeReason: reason,
          changedAt: now
        };
      }
      await db.tasks.update(taskId, { status: 'deferred', updatedAt: now });
    } else if (action === 'replace' && replacementTaskId) {
      const idx = updatedTasks.findIndex(t => t.taskId === taskId);
      if (idx !== -1) {
        const originalPriority = updatedTasks[idx].priority;
        updatedTasks[idx] = {
          ...updatedTasks[idx],
          wasChanged: true,
          changeReason: `Replaced by ${replacementTaskId}: ${reason}`,
          changedAt: now,
          deferred: true
        };
        updatedTasks.push({
          taskId: replacementTaskId,
          priority: originalPriority,
          originalIndex: updatedTasks.length,
          completed: false,
          deferred: false,
          wasChanged: true,
          changeReason: `Replacement for ${taskId}`
        });
      }
      await db.tasks.update(taskId, { status: 'deferred', updatedAt: now });
      await db.tasks.update(replacementTaskId, { status: 'committed', updatedAt: now });
    }

    await db.commitments.update(date, { tasks: updatedTasks, updatedAt: now });
    await this.recordEvent('PLAN_CHANGED', 'commitment', date, {
      taskId,
      action,
      reason,
      replacementTaskId
    });
  }

  async startTask(taskId: string): Promise<{ startDelayMinutes: number }> {
    const task = await db.tasks.get(taskId);
    if (!task) return { startDelayMinutes: 0 };
    const now = new Date();
    const nowIso = now.toISOString();

    let startDelayMinutes = 0;
    if (task.plannedStart) {
      const planned = new Date(task.plannedStart);
      const diffMs = now.getTime() - planned.getTime();
      startDelayMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    await db.tasks.update(taskId, {
      status: 'in_progress',
      actualStart: task.actualStart || nowIso,
      updatedAt: nowIso
    });

    await this.recordEvent('TASK_STARTED', 'task', taskId, {
      actualStart: nowIso,
      plannedStart: task.plannedStart,
      startDelayMinutes
    });

    if (startDelayMinutes > 0) {
      await this.recordEvent('START_DELAY_RECORDED', 'task', taskId, {
        delayMinutes: startDelayMinutes
      });
    }

    return { startDelayMinutes };
  }

  async pauseTask(taskId: string, elapsedSeconds: number): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    const nowIso = new Date().toISOString();
    await db.tasks.update(taskId, {
      status: 'paused',
      actualDurationSeconds: elapsedSeconds,
      updatedAt: nowIso
    });
    await this.recordEvent('TASK_PAUSED', 'task', taskId, { elapsedSeconds });
  }

  async resumeTask(taskId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    await db.tasks.update(taskId, {
      status: 'in_progress',
      updatedAt: nowIso
    });
    await this.recordEvent('TASK_RESUMED', 'task', taskId, {});
  }

  async completeTask(taskId: string, elapsedSeconds: number, evidenceNote?: string): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    const nowIso = new Date().toISOString();

    await db.transaction('rw', db.tasks, db.commitments, async () => {
      await db.tasks.update(taskId, {
        status: 'completed',
        completedAt: nowIso,
        actualDurationSeconds: elapsedSeconds,
        evidenceNote,
        updatedAt: nowIso
      });

      // Mark in today's commitment if present
      const todayDate = nowIso.slice(0, 10);
      const commitment = await db.commitments.get(todayDate);
      if (commitment) {
        const updatedTasks = commitment.tasks.map(t =>
          t.taskId === taskId ? { ...t, completed: true } : t
        );
        await db.commitments.update(todayDate, { tasks: updatedTasks, updatedAt: nowIso });
      }
    });

    await this.recordEvent('TASK_COMPLETED', 'task', taskId, {
      durationSeconds: elapsedSeconds,
      evidenceNote
    });
  }

  async deferTask(taskId: string, reason: FrictionCategory, note?: string): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    const nowIso = new Date().toISOString();

    const newDeferralCount = (task.deferralCount || 0) + 1;
    await db.tasks.update(taskId, {
      status: 'deferred',
      deferralCount: newDeferralCount,
      lastFrictionReason: reason,
      updatedAt: nowIso
    });

    await this.recordEvent('TASK_DEFERRED', 'task', taskId, {
      deferralCount: newDeferralCount,
      reason,
      note
    });

    await this.recordEvent('FRICTION_DIAGNOSED', 'task', taskId, {
      category: reason,
      note
    });
  }

  async recordFriction(taskId: string, category: FrictionCategory, note?: string): Promise<void> {
    await db.tasks.update(taskId, {
      lastFrictionReason: category,
      updatedAt: new Date().toISOString()
    });
    await this.recordEvent('FRICTION_DIAGNOSED', 'task', taskId, {
      category,
      note
    });
  }

  async captureNovelty(content: string): Promise<NoveltyCapture> {
    const nowIso = new Date().toISOString();
    const item: NoveltyCapture = {
      id: crypto.randomUUID(),
      content: content.trim(),
      capturedAt: nowIso,
      status: 'unprocessed'
    };
    await db.noveltyCaptures.put(item);
    await this.recordEvent('NOVELTY_CAPTURED', 'novelty', item.id, { content: item.content });
    return item;
  }

  async getUnprocessedNovelties(): Promise<NoveltyCapture[]> {
    return db.noveltyCaptures.where('status').equals('unprocessed').reverse().sortBy('capturedAt');
  }

  async promoteNoveltyToTask(noveltyId: string, taskTitle: string): Promise<Task> {
    const task = await this.createTask({ title: taskTitle });
    await db.noveltyCaptures.update(noveltyId, {
      status: 'promoted_to_task',
      promotedTaskId: task.id
    });
    await this.recordEvent('NOVELTY_PROMOTED', 'novelty', noveltyId, { promotedTaskId: task.id });
    return task;
  }

  async dismissNovelty(noveltyId: string): Promise<void> {
    await db.noveltyCaptures.update(noveltyId, { status: 'dismissed' });
  }

  async reconcileDay(date: string, resolutions: {
    taskId: string;
    action: 'COMPLETE_NOW' | 'MOVE_TO_TOMORROW' | 'BREAK_DOWN' | 'DELETE';
    reason?: FrictionCategory | string;
    note?: string;
  }[]): Promise<void> {
    const nowIso = new Date().toISOString();
    const commitment = await db.commitments.get(date);

    for (const res of resolutions) {
      const task = await db.tasks.get(res.taskId);
      if (!task) continue;

      if (res.action === 'COMPLETE_NOW') {
        await this.completeTask(res.taskId, task.actualDurationSeconds || 0, 'Reconciled during Day Close');
      } else if (res.action === 'MOVE_TO_TOMORROW') {
        const count = (task.deferralCount || 0) + 1;
        await db.tasks.update(res.taskId, {
          status: 'deferred',
          deferralCount: count,
          lastFrictionReason: res.reason as FrictionCategory,
          updatedAt: nowIso
        });
        await this.recordEvent('TASK_DEFERRED', 'task', res.taskId, {
          deferralCount: count,
          reason: res.reason,
          note: res.note
        });
      } else if (res.action === 'DELETE') {
        await this.deleteTask(res.taskId, String(res.reason));
      } else if (res.action === 'BREAK_DOWN') {
        // Break into a micro step task
        await this.createTask({
          title: `${task.title} (Micro Step)`,
          microAction: res.note || 'First 10-minute pass',
          estimatedMinutes: 15,
          priority: task.priority
        });
        await db.tasks.update(res.taskId, { status: 'deferred', updatedAt: nowIso });
        await this.recordEvent('DEFERRAL_DEBT_ACTION', 'task', res.taskId, {
          action: 'BREAK_DOWN',
          note: res.note
        });
      }
    }

    if (commitment) {
      await db.commitments.update(date, {
        reconciledAt: nowIso,
        updatedAt: nowIso
      });
    }

    await this.recordEvent('DAY_CLOSED', 'day', date, {
      reconciledCount: resolutions.length,
      resolutions
    });
  }

  async recordEvent(
    type: EventType,
    entityType: DomainEvent['entityType'],
    entityId: string,
    payload: Record<string, any> = {}
  ): Promise<DomainEvent> {
    const event: DomainEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      entityType,
      entityId,
      payload
    };
    await db.events.put(event);
    return event;
  }

  async getEvents(limit: number = 200): Promise<DomainEvent[]> {
    return db.events.orderBy('timestamp').reverse().limit(limit).toArray();
  }

  async getEventsForDate(date: string): Promise<DomainEvent[]> {
    // Return events where timestamp starts with date string (YYYY-MM-DD)
    return db.events
      .filter(e => e.timestamp.startsWith(date))
      .toArray();
  }
}

export const repo = new LocalRepository();

