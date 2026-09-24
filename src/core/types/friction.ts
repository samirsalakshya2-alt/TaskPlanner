import { FrictionCategory } from './domain';

export type DeferralAction =
  | 'DO_TODAY'
  | 'MICRO_STEP'
  | 'REDESIGN'
  | 'DELETE';

export interface FrictionObservation {
  id: string;
  taskId: string;
  category: FrictionCategory;
  note?: string;
  timestamp: string;
}

export interface CheckInResponse {
  id: string;
  activity: 'PLANNED_TASK' | 'ANOTHER_TASK' | 'BREAK' | 'DISTRACTED';
  isMoreImportantThanPlan?: boolean;
  activeTaskId?: string;
  timestamp: string;
}

