import { Task, FrictionCategory } from '../types/domain';

export interface FrictionCheckResult {
  hasFriction: boolean;
  flags: {
    startDelay?: { delayMinutes: number };
    repeatedDeferral?: { deferralCount: number };
    durationOverrun?: { actualSeconds: number; estimatedSeconds: number; ratio: number };
    avoidanceFlagged?: boolean;
  };
}

export class FrictionEngine {
  static checkTaskFriction(
    task: Task,
    preferences = {
      startDelayThresholdMinutes: 15,
      underestimateRatioThreshold: 1.5,
      deferralThreshold: 3
    }
  ): FrictionCheckResult {
    const flags: FrictionCheckResult['flags'] = {};
    let hasFriction = false;

    // 1. Start Delay check
    if (task.plannedStart && task.actualStart) {
      const planned = new Date(task.plannedStart).getTime();
      const actual = new Date(task.actualStart).getTime();
      const delayMinutes = Math.max(0, Math.round((actual - planned) / 60000));
      if (delayMinutes >= preferences.startDelayThresholdMinutes) {
        flags.startDelay = { delayMinutes };
        hasFriction = true;
      }
    }

    // 2. Repeated Deferral check
    if (task.deferralCount >= preferences.deferralThreshold) {
      flags.repeatedDeferral = { deferralCount: task.deferralCount };
      hasFriction = true;
    }

    // 3. Duration Overrun check
    if (task.estimatedMinutes && task.actualDurationSeconds > 0) {
      const estimatedSeconds = task.estimatedMinutes * 60;
      const ratio = task.actualDurationSeconds / estimatedSeconds;
      if (ratio >= preferences.underestimateRatioThreshold) {
        flags.durationOverrun = {
          actualSeconds: task.actualDurationSeconds,
          estimatedSeconds,
          ratio: Math.round(ratio * 10) / 10
        };
        hasFriction = true;
      }
    }

    // 4. Explicit Avoidance Flag
    if (task.lastFrictionReason === 'AVOIDING_IT') {
      flags.avoidanceFlagged = true;
      hasFriction = true;
    }

    return { hasFriction, flags };
  }

  static getHumanFrictionDescription(category: FrictionCategory): string {
    switch (category) {
      case 'TOO_BIG':
        return 'Task scope feels too large or unmanageable';
      case 'DONT_KNOW_HOW':
        return 'Uncertainty around how to execute';
      case 'AVOIDING_IT':
        return 'Emotional avoidance or reluctance';
      case 'INTERRUPTED':
        return 'External interruption or urgency';
      case 'UNDERESTIMATED':
        return 'Time required was underestimated';
      case 'NOT_IMPORTANT':
        return 'Deemed no longer high priority';
      case 'OTHER':
      default:
        return 'Unspecified friction';
    }
  }
}

