import { describe, it, expect } from 'vitest';
import { WIPGuard } from '../core/engine/wipGuard';
import { Project } from '../core/types/domain';

describe('WIPGuard', () => {
  it('allows activating project when active projects are below limit', () => {
    const projects: Project[] = [
      { id: '1', name: 'P1', status: 'active', createdAt: '' },
      { id: '2', name: 'P2', status: 'active', createdAt: '' },
      { id: '3', name: 'P3', status: 'paused', createdAt: '' }
    ];

    const result = WIPGuard.canActivateProject(projects, 5);
    expect(result.allowed).toBe(true);
    expect(result.activeCount).toBe(2);
  });

  it('blocks activating project when active projects reach limit of 5', () => {
    const projects: Project[] = [
      { id: '1', name: 'P1', status: 'active', createdAt: '' },
      { id: '2', name: 'P2', status: 'active', createdAt: '' },
      { id: '3', name: 'P3', status: 'active', createdAt: '' },
      { id: '4', name: 'P4', status: 'active', createdAt: '' },
      { id: '5', name: 'P5', status: 'active', createdAt: '' },
      { id: '6', name: 'P6', status: 'paused', createdAt: '' }
    ];

    const result = WIPGuard.canActivateProject(projects, 5);
    expect(result.allowed).toBe(false);
    expect(result.activeCount).toBe(5);
  });
});

