import { describe, it, expect } from 'vitest';
import { MetricsEngine } from '../core/engine/metrics';
import { DailyCommitment, Task } from '../core/types/domain';

describe('MetricsEngine', () => {
  it('correctly calculates daily commitment integrity percentage', () => {
    const commitment: DailyCommitment = {
      id: '2026-09-24',
      date: '2026-09-24',
      isLocked: true,
      tasks: [
        { taskId: 't1', priority: 'P0', originalIndex: 0, completed: true, deferred: false, wasChanged: false },
        { taskId: 't2', priority: 'P1', originalIndex: 1, completed: true, deferred: false, wasChanged: false },
        { taskId: 't3', priority: 'P1', originalIndex: 2, completed: true, deferred: false, wasChanged: false },
        { taskId: 't4', priority: 'P2', originalIndex: 3, completed: false, deferred: true, wasChanged: false }
      ],
      createdAt: '',
      updatedAt: ''
    };

    const metrics = MetricsEngine.calculateDailyMetrics(commitment, []);
    expect(metrics.totalCommitted).toBe(4);
    expect(metrics.totalCompleted).toBe(3);
    expect(metrics.totalDeferred).toBe(1);
    expect(metrics.integrityRate).toBe(75);
    expect(metrics.p0Committed).toBe(1);
    expect(metrics.p0Completed).toBe(1);
  });

  it('computes average start delay across tasks with planned and actual starts', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        priority: 'P0',
        status: 'completed',
        plannedStart: '2026-09-24T10:00:00.000Z',
        actualStart: '2026-09-24T10:20:00.000Z', // 20m
        actualDurationSeconds: 1200,
        deferralCount: 0,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 't2',
        title: 'Task 2',
        priority: 'P1',
        status: 'completed',
        plannedStart: '2026-09-24T14:00:00.000Z',
        actualStart: '2026-09-24T14:40:00.000Z', // 40m
        actualDurationSeconds: 1800,
        deferralCount: 0,
        createdAt: '',
        updatedAt: ''
      }
    ];

    const commitment: DailyCommitment = {
      id: '2026-09-24',
      date: '2026-09-24',
      isLocked: true,
      tasks: [
        { taskId: 't1', priority: 'P0', originalIndex: 0, completed: true, deferred: false, wasChanged: false },
        { taskId: 't2', priority: 'P1', originalIndex: 1, completed: true, deferred: false, wasChanged: false }
      ],
      createdAt: '',
      updatedAt: ''
    };

    const metrics = MetricsEngine.calculateDailyMetrics(commitment, tasks);
    expect(metrics.avgStartDelayMinutes).toBe(30); // (20 + 40) / 2 = 30 min
  });
});

