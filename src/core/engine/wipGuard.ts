import { Project } from '../types/domain';

export class WIPGuard {
  static canActivateProject(projects: Project[], limit: number = 5): {
    allowed: boolean;
    activeCount: number;
    activeProjects: Project[];
  } {
    const activeProjects = projects.filter(p => p.status === 'active');
    return {
      allowed: activeProjects.length < limit,
      activeCount: activeProjects.length,
      activeProjects
    };
  }
}

