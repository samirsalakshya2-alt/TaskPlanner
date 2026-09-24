import Dexie, { type Table } from 'dexie';
import {
  UserProfile,
  Area,
  Objective,
  Project,
  Task,
  DailyCommitment,
  NoveltyCapture
} from '../types/domain';
import { DomainEvent } from '../types/events';

export class TaskPlannerDB extends Dexie {
  users!: Table<UserProfile, string>;
  areas!: Table<Area, string>;
  objectives!: Table<Objective, string>;
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  commitments!: Table<DailyCommitment, string>;
  noveltyCaptures!: Table<NoveltyCapture, string>;
  events!: Table<DomainEvent, string>;

  constructor() {
    super('TaskPlannerDB');
    this.version(1).stores({
      users: 'id',
      areas: 'id, name',
      objectives: 'id, areaId, status',
      projects: 'id, areaId, status',
      tasks: 'id, status, priority, areaId, projectId, deferralCount, plannedStart, actualStart, createdAt',
      commitments: 'id, date, isLocked',
      noveltyCaptures: 'id, status, capturedAt',
      events: 'id, type, timestamp, entityType, entityId'
    });
  }
}

export const db = new TaskPlannerDB();

