import { Task, DailyCommitment, FrictionCategory, Project } from '../types/domain';
import { DomainEvent } from '../types/events';

export interface DailyMetrics {
  date: string;
  totalCommitted: number;
  totalCompleted: number;
  totalDeferred: number;
  integrityRate: number; // percentage 0-100
  p0Committed: number;
  p0Completed: number;
  avgStartDelayMinutes: number;
}

export interface OperationalReviewData {
  timeframe: 'day' | 'week';
  commitmentsCount: number;
  completedCount: number;
  deferredCount: number;
  integrityRate: number;
  avgStartDelayMinutes: number;
  avgDurationRatio: number; // e.g. 1.25x
  p0IntegrityRate: number;
  frictionCounts: Record<FrictionCategory, number>;
  topFrictionCategory?: FrictionCategory;
  deferralDebtTasks: Task[];
  activeProjectsCount: number;
  wipLimit: number;
}

export class MetricsEngine {
  static calculateDailyMetrics(commitment?: DailyCommitment, tasks: Task[] = []): DailyMetrics {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const committedItems = commitment?.tasks || [];
    const totalCommitted = committedItems.length;

    let totalCompleted = 0;
    let totalDeferred = 0;
    let p0Committed = 0;
    let p0Completed = 0;
    let totalStartDelay = 0;
    let startDelayCount = 0;

    for (const item of committedItems) {
      if (item.priority === 'P0') p0Committed++;
      if (item.completed) {
        totalCompleted++;
        if (item.priority === 'P0') p0Completed++;
      }
      if (item.deferred) {
        totalDeferred++;
      }

      const task = taskMap.get(item.taskId);
      if (task?.plannedStart && task.actualStart) {
        const diffMs = new Date(task.actualStart).getTime() - new Date(task.plannedStart).getTime();
        const delay = Math.max(0, Math.round(diffMs / 60000));
        totalStartDelay += delay;
        startDelayCount++;
      }
    }

    const integrityRate = totalCommitted > 0 ? Math.round((totalCompleted / totalCommitted) * 100) : 0;
    const avgStartDelayMinutes = startDelayCount > 0 ? Math.round(totalStartDelay / startDelayCount) : 0;

    return {
      date: commitment?.date || new Date().toISOString().slice(0, 10),
      totalCommitted,
      totalCompleted,
      totalDeferred,
      integrityRate,
      p0Committed,
      p0Completed,
      avgStartDelayMinutes
    };
  }

  static calculateOperationsReview(
    tasks: Task[],
    commitments: DailyCommitment[],
    events: DomainEvent[],
    projects: Project[],
    wipLimit = 5
  ): OperationalReviewData {
    let totalCommitted = 0;
    let totalCompleted = 0;
    let totalDeferred = 0;
    let p0Committed = 0;
    let p0Completed = 0;

    for (const comm of commitments) {
      for (const item of comm.tasks) {
        totalCommitted++;
        if (item.priority === 'P0') p0Committed++;
        if (item.completed) {
          totalCompleted++;
          if (item.priority === 'P0') p0Completed++;
        }
        if (item.deferred) {
          totalDeferred++;
        }
      }
    }

    // Start delays from events or tasks
    const startDelayEvents = events.filter(e => e.type === 'START_DELAY_RECORDED');
    const totalStartDelayMinutes = startDelayEvents.reduce((acc, e) => acc + (e.payload.delayMinutes || 0), 0);
    const avgStartDelayMinutes = startDelayEvents.length > 0 ? Math.round(totalStartDelayMinutes / startDelayEvents.length) : 0;

    // Duration vs Estimate
    let durationRatioSum = 0;
    let durationRatioCount = 0;
    for (const t of tasks) {
      if (t.estimatedMinutes && t.actualDurationSeconds > 0) {
        const ratio = t.actualDurationSeconds / (t.estimatedMinutes * 60);
        durationRatioSum += ratio;
        durationRatioCount++;
      }
    }
    const avgDurationRatio = durationRatioCount > 0 ? Math.round((durationRatioSum / durationRatioCount) * 100) / 100 : 1;

    // Friction counts
    const frictionCounts: Record<FrictionCategory, number> = {
      TOO_BIG: 0,
      DONT_KNOW_HOW: 0,
      AVOIDING_IT: 0,
      INTERRUPTED: 0,
      UNDERESTIMATED: 0,
      NOT_IMPORTANT: 0,
      OTHER: 0
    };

    events
      .filter(e => e.type === 'FRICTION_DIAGNOSED')
      .forEach(e => {
        const cat = e.payload.category as FrictionCategory;
        if (cat && frictionCounts[cat] !== undefined) {
          frictionCounts[cat]++;
        }
      });

    let topFrictionCategory: FrictionCategory | undefined;
    let maxFrictionCount = 0;
    for (const [cat, count] of Object.entries(frictionCounts)) {
      if (count > maxFrictionCount) {
        maxFrictionCount = count;
        topFrictionCategory = cat as FrictionCategory;
      }
    }

    // Deferral debt tasks
    const deferralDebtTasks = tasks
      .filter(t => t.deferralCount >= 3 && t.status !== 'completed' && t.status !== 'abandoned')
      .sort((a, b) => b.deferralCount - a.deferralCount);

    const activeProjectsCount = projects.filter(p => p.status === 'active').length;

    const integrityRate = totalCommitted > 0 ? Math.round((totalCompleted / totalCommitted) * 100) : 0;
    const p0IntegrityRate = p0Committed > 0 ? Math.round((p0Completed / p0Committed) * 100) : 0;

    return {
      timeframe: 'week',
      commitmentsCount: totalCommitted,
      completedCount: totalCompleted,
      deferredCount: totalDeferred,
      integrityRate,
      avgStartDelayMinutes,
      avgDurationRatio,
      p0IntegrityRate,
      frictionCounts,
      topFrictionCategory,
      deferralDebtTasks,
      activeProjectsCount,
      wipLimit
    };
  }
}

