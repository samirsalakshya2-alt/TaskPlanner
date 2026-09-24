import { describe, it, expect } from 'vitest';
import { FrictionEngine } from '../core/engine/frictionEngine';
import { Task } from '../core/types/domain';

describe('FrictionEngine', () => {
  it('detects start delay when actual start exceeds planned start by threshold', () => {
    const planned = '2026-09-24T10:00:00.000Z';
    const actual = '2026-09-24T10:35:00.000Z'; // 35 min delay

    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      priority: 'P0',
      status: 'in_progress',
      plannedStart: planned,
      actualStart: actual,
      actualDurationSeconds: 0,
      deferralCount: 0,
      createdAt: planned,
      updatedAt: actual
    };

    const result = FrictionEngine.checkTaskFriction(task, {
      startDelayThresholdMinutes: 15,
      underestimateRatioThreshold: 1.5,
      deferralThreshold: 3
    });

    expect(result.hasFriction).toBe(true);
    expect(result.flags.startDelay?.delayMinutes).toBe(35);
  });

  it('detects repeated deferral when task deferred 3 or more times', () => {
    const task: Task = {
      id: 'task-2',
      title: 'Deferred Task',
      priority: 'P1',
      status: 'deferred',
      actualDurationSeconds: 0,
      deferralCount: 3,
      createdAt: '2026-09-21T10:00:00.000Z',
      updatedAt: '2026-09-24T10:00:00.000Z'
    };

    const result = FrictionEngine.checkTaskFriction(task);
    expect(result.hasFriction).toBe(true);
    expect(result.flags.repeatedDeferral?.deferralCount).toBe(3);
  });

  it('detects duration overrun when actual duration exceeds estimated * 1.5', () => {
    const task: Task = {
      id: 'task-3',
      title: 'Long Task',
      priority: 'P1',
      status: 'completed',
      estimatedMinutes: 30, // 1800s
      actualDurationSeconds: 3600, // 60m = 2x
      deferralCount: 0,
      createdAt: '2026-09-24T10:00:00.000Z',
      updatedAt: '2026-09-24T11:00:00.000Z'
    };

    const result = FrictionEngine.checkTaskFriction(task);
    expect(result.hasFriction).toBe(true);
    expect(result.flags.durationOverrun?.ratio).toBe(2);
  });

  it('flags avoidance pattern when last friction reason was AVOIDING_IT', () => {
    const task: Task = {
      id: 'task-4',
      title: 'Avoided Task',
      priority: 'P0',
      status: 'deferred',
      lastFrictionReason: 'AVOIDING_IT',
      actualDurationSeconds: 0,
      deferralCount: 1,
      createdAt: '2026-09-24T10:00:00.000Z',
      updatedAt: '2026-09-24T10:00:00.000Z'
    };

    const result = FrictionEngine.checkTaskFriction(task);
    expect(result.hasFriction).toBe(true);
    expect(result.flags.avoidanceFlagged).toBe(true);
  });
});

