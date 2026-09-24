import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock, Plus, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';
import { Task, PriorityLevel, FrictionCategory } from '../../core/types/domain';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PlanChangeModal } from '../../components/dialogs/PlanChangeModal';
import { TaskCompilerModal } from '../../components/dialogs/TaskCompilerModal';
import { DeferralDebtModal } from '../../components/dialogs/DeferralDebtModal';

interface TodayScreenProps {
  onGoToNow: (taskId: string) => void;
  onOpenDayClose: () => void;
  onOpenCheckIn: (activeTaskTitle?: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  onGoToNow,
  onOpenDayClose,
  onOpenCheckIn
}) => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const commitment = useLiveQuery(() => repo.getCommitmentForDate(todayDate), [todayDate]);
  const allTasks = useLiveQuery(() => repo.getBacklogTasks()) || [];
  const allSavedTasks = useLiveQuery(async () => {
    const list = await repo.getBacklogTasks();
    const inProg = await repo.getTasksByStatus('in_progress');
    const comp = await repo.getTasksByStatus('completed');
    const comm = await repo.getTasksByStatus('committed');
    return [...list, ...inProg, ...comp, ...comm];
  }) || [];

  // Local state for morning planning selection
  const [selectedP0, setSelectedP0] = useState<string[]>([]);
  const [selectedP1, setSelectedP1] = useState<string[]>([]);
  const [selectedP2, setSelectedP2] = useState<string[]>([]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaultPriority, setTaskModalDefaultPriority] = useState<PriorityLevel>('P1');
  const [planChangeTask, setPlanChangeTask] = useState<Task | null>(null);
  const [deferralDebtTask, setDeferralDebtTask] = useState<Task | null>(null);

  const isLocked = commitment?.isLocked ?? false;

  // Format date nicely
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Calculate greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  // Committed tasks map
  const taskMap = new Map(allSavedTasks.map(t => [t.id, t]));
  const committedItems = commitment?.tasks || [];

  const completedCount = committedItems.filter(i => i.completed).length;
  const totalCount = committedItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Morning lock action
  const handleLockToday = async () => {
    const items: { taskId: string; priority: PriorityLevel }[] = [
      ...selectedP0.map(id => ({ taskId: id, priority: 'P0' as PriorityLevel })),
      ...selectedP1.map(id => ({ taskId: id, priority: 'P1' as PriorityLevel })),
      ...selectedP2.map(id => ({ taskId: id, priority: 'P2' as PriorityLevel }))
    ];

    if (items.length === 0) return;

    await repo.setTodayCommitments(todayDate, items);
    await repo.lockDay(todayDate);
  };

  const handlePlanChangeConfirm = async (reason: FrictionCategory, note?: string) => {
    if (!planChangeTask) return;
    await repo.alterLockedPlan(todayDate, planChangeTask.id, 'remove', `${reason}${note ? ': ' + note : ''}`);
    setPlanChangeTask(null);
  };

  const handleDeferralDebtAction = async (action: 'DO_TODAY' | 'MICRO_STEP' | 'REDESIGN' | 'DELETE') => {
    if (!deferralDebtTask) return;
    if (action === 'DO_TODAY') {
      await repo.updateTask(deferralDebtTask.id, { priority: 'P0' });
    } else if (action === 'MICRO_STEP') {
      await repo.createTask({
        title: `${deferralDebtTask.title} (Micro-Step)`,
        microAction: 'First 10-minute pass',
        priority: 'P0',
        estimatedMinutes: 15
      });
    } else if (action === 'DELETE') {
      await repo.deleteTask(deferralDebtTask.id, 'Dropped via deferral debt intervention');
    }
    setDeferralDebtTask(null);
  };

  const toggleCandidateSelection = (taskId: string, priority: PriorityLevel) => {
    if (priority === 'P0') {
      if (selectedP0.includes(taskId)) {
        setSelectedP0(prev => prev.filter(id => id !== taskId));
      } else {
        if (selectedP0.length >= 2) return; // Enforce max 2 P0
        setSelectedP0(prev => [...prev, taskId]);
        setSelectedP1(prev => prev.filter(id => id !== taskId));
        setSelectedP2(prev => prev.filter(id => id !== taskId));
      }
    } else if (priority === 'P1') {
      if (selectedP1.includes(taskId)) {
        setSelectedP1(prev => prev.filter(id => id !== taskId));
      } else {
        if (selectedP1.length >= 3) return; // Enforce max 3 P1
        setSelectedP1(prev => [...prev, taskId]);
        setSelectedP0(prev => prev.filter(id => id !== taskId));
        setSelectedP2(prev => prev.filter(id => id !== taskId));
      }
    } else if (priority === 'P2') {
      if (selectedP2.includes(taskId)) {
        setSelectedP2(prev => prev.filter(id => id !== taskId));
      } else {
        if (selectedP2.length >= 3) return; // Enforce max 3 P2
        setSelectedP2(prev => [...prev, taskId]);
        setSelectedP0(prev => prev.filter(id => id !== taskId));
        setSelectedP1(prev => prev.filter(id => id !== taskId));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Top Header */}
      <div className="pt-2 pb-1 border-b border-console-border flex items-start justify-between">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-console-muted uppercase">
            {greeting}
          </div>
          <h1 className="text-lg font-bold text-console-text">
            {todayFormatted}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenCheckIn()}
            className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-console-card border border-console-border text-console-muted hover:text-console-text"
          >
            Check-In
          </button>
        </div>
      </div>

      {/* VIEW 1: DAY IS LOCKED (EXECUTION MODE) */}
      {isLocked ? (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Progress Tracker */}
          <div className="bg-console-card border border-console-border rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-console-muted uppercase">Daily Commitments</span>
              <span className="text-console-text font-bold">
                {completedCount} of {totalCount} done ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-console-bg rounded-full overflow-hidden border border-console-border">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Committed Tasks List */}
          <div className="flex-1 space-y-2.5">
            {committedItems.map(item => {
              const task = taskMap.get(item.taskId);
              if (!task) return null;

              const isCompleted = item.completed || task.status === 'completed';
              const isStalled = (task.deferralCount || 0) >= 3;

              return (
                <div
                  key={task.id}
                  className={`border rounded-xl p-3.5 transition-all ${
                    isCompleted
                      ? 'bg-console-surface/40 border-console-border/40 opacity-70'
                      : 'bg-console-surface border-console-border shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <PriorityBadge priority={item.priority} />
                      {task.deferralCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setDeferralDebtTask(task)}
                          className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isStalled
                              ? 'bg-red-950 text-red-300 border border-red-700 font-bold animate-pulse'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          DEFERRED {task.deferralCount}X
                        </button>
                      )}
                    </div>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => setPlanChangeTask(task)}
                        className="text-[10px] font-mono text-console-muted hover:text-amber-400 uppercase"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-console-text mb-1.5">
                    {task.title}
                  </div>

                  {task.microAction && !isCompleted && (
                    <div className="text-xs text-console-muted bg-console-card/60 p-2 rounded border border-console-border/50 mb-2">
                      <span className="text-console-accent font-mono text-[10px] uppercase block">
                        First 2-min micro step:
                      </span>
                      {task.microAction}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono text-console-muted pt-1">
                    <span>
                      {task.estimatedMinutes ? `${task.estimatedMinutes} min effort` : 'Flexible'}
                    </span>

                    {isCompleted ? (
                      <div className="flex items-center text-emerald-400 space-x-1 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onGoToNow(task.id)}
                        className="px-3.5 py-1.5 bg-console-accent hover:bg-blue-600 text-white rounded-lg text-xs font-mono uppercase font-semibold flex items-center space-x-1 active:scale-95 transition-transform"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evening Recovery Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenDayClose}
              className="w-full py-3 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-xl text-xs font-mono uppercase font-semibold tracking-wider transition-colors"
            >
              Close Day & Reconcile Commitments
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: UNLOCKED (MORNING COMMITMENT WORKFLOW) */
        <div className="flex-1 flex flex-col space-y-4">
          <div className="bg-console-card border border-console-border rounded-xl p-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-console-accent font-semibold mb-1">
              Morning Commitment Protocol (2–5 mins)
            </h2>
            <p className="text-xs text-console-muted">
              Select what will physically happen today. Maximum 1–2 Critical (P0) and 2–3 Important (P1).
            </p>
          </div>

          {/* Candidate Task List */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-console-muted">Available Backlog</span>
              <button
                type="button"
                onClick={() => {
                  setTaskModalDefaultPriority('P1');
                  setIsTaskModalOpen(true);
                }}
                className="text-xs font-mono text-console-accent hover:text-blue-400 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {allTasks.length === 0 ? (
              <div className="text-center py-10 bg-console-card/50 border border-dashed border-console-border rounded-xl p-4">
                <p className="text-xs text-console-muted mb-3">No backlog items yet.</p>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="px-4 py-2 bg-console-accent text-white rounded-lg text-xs font-mono font-semibold"
                >
                  Create First Task
                </button>
              </div>
            ) : (
              allTasks.map(task => {
                const isP0 = selectedP0.includes(task.id);
                const isP1 = selectedP1.includes(task.id);
                const isP2 = selectedP2.includes(task.id);

                return (
                  <div
                    key={task.id}
                    className={`border rounded-xl p-3 bg-console-surface transition-colors ${
                      isP0
                        ? 'border-red-500/80 bg-red-950/20'
                        : isP1
                        ? 'border-amber-500/80 bg-amber-950/20'
                        : isP2
                        ? 'border-slate-500/80 bg-slate-900/30'
                        : 'border-console-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-xs font-semibold text-console-text">
                        {task.title}
                      </div>
                      {task.deferralCount > 0 && (
                        <span className="text-[10px] font-mono px-1 rounded bg-amber-950 text-amber-400 border border-amber-800 flex-shrink-0">
                          DEFERRED {task.deferralCount}X
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-console-muted">
                        {task.estimatedMinutes ? `${task.estimatedMinutes}m` : 'Flexible'}
                      </span>

                      {/* 1-tap Priority selection chips */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(task.id, 'P0')}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
                            isP0
                              ? 'bg-red-600 text-white border-red-500'
                              : 'bg-console-card border-console-border text-console-muted hover:text-red-400'
                          }`}
                        >
                          P0
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(task.id, 'P1')}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
                            isP1
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-console-card border-console-border text-console-muted hover:text-amber-400'
                          }`}
                        >
                          P1
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(task.id, 'P2')}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border ${
                            isP2
                              ? 'bg-slate-700 text-white border-slate-600'
                              : 'bg-console-card border-console-border text-console-muted hover:text-slate-300'
                          }`}
                        >
                          P2
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Morning Lock Bar */}
          <div className="sticky bottom-20 bg-console-surface/95 backdrop-blur border border-console-border rounded-xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-console-muted">Selected commitments:</span>
              <span className="text-console-text font-bold">
                {selectedP0.length} P0 • {selectedP1.length} P1 • {selectedP2.length} P2
              </span>
            </div>

            <button
              type="button"
              disabled={selectedP0.length === 0 && selectedP1.length === 0 && selectedP2.length === 0}
              onClick={handleLockToday}
              className="w-full py-3 bg-console-accent hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center space-x-2 transition-colors active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Today</span>
            </button>
          </div>
        </div>
      )}

      {/* Plan Change Interception Modal */}
      <PlanChangeModal
        isOpen={!!planChangeTask}
        taskTitle={planChangeTask?.title || ''}
        onConfirm={handlePlanChangeConfirm}
        onCancel={() => setPlanChangeTask(null)}
      />

      {/* Lightweight Task Creator */}
      <TaskCompilerModal
        isOpen={isTaskModalOpen}
        defaultPriority={taskModalDefaultPriority}
        onClose={() => setIsTaskModalOpen(false)}
      />

      {/* Deferral Debt Intervention Modal */}
      <DeferralDebtModal
        isOpen={!!deferralDebtTask}
        task={deferralDebtTask}
        onAction={handleDeferralDebtAction}
        onDismiss={() => setDeferralDebtTask(null)}
      />
    </div>
  );
};
