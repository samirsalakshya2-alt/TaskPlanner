export type EventType =
  | 'TASK_CREATED'
  | 'TASK_EDITED'
  | 'TASK_COMMITTED'
  | 'DAY_LOCKED'
  | 'TASK_STARTED'
  | 'TASK_PAUSED'
  | 'TASK_RESUMED'
  | 'TASK_COMPLETED'
  | 'TASK_DEFERRED'
  | 'TASK_DELETED'
  | 'START_DELAY_RECORDED'
  | 'PLAN_CHANGED'
  | 'CHECKIN_RECORDED'
  | 'FRICTION_DIAGNOSED'
  | 'DEFERRAL_DEBT_ACTION'
  | 'NOVELTY_CAPTURED'
  | 'NOVELTY_PROMOTED'
  | 'DAY_CLOSED'
  | 'PROJECT_WIP_CHANGED';

export interface DomainEvent {
  id: string;
  type: EventType;
  timestamp: string; // ISO 8601 UTC
  entityType: 'task' | 'commitment' | 'project' | 'novelty' | 'checkin' | 'day';
  entityId: string;
  payload: Record<string, any>;
}

