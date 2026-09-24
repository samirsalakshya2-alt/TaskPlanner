import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Layers, HelpCircle } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';
import { FrictionCategory } from '../../core/types/domain';
import { MetricsEngine } from '../../core/engine/metrics';
import { FrictionEngine } from '../../core/engine/frictionEngine';
import { WIPLimitModal } from '../../components/dialogs/WIPLimitModal';

export const ReviewScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly'>('daily');

  const todayDate = new Date().toISOString().slice(0, 10);
  const commitment = useLiveQuery(() => repo.getCommitmentForDate(todayDate), [todayDate]);
  const allTasks = useLiveQuery(async () => {
    const list = await repo.getBacklogTasks();
    const inProg = await repo.getTasksByStatus('in_progress');
    const comp = await repo.getTasksByStatus('completed');
    const comm = await repo.getTasksByStatus('committed');
    return [...list, ...inProg, ...comp, ...comm];
  }) || [];

  const allCommitments = useLiveQuery(async () => {
    const list = await repo.getCommitmentForDate(todayDate);
    return list ? [list] : [];
  }) || [];

  const allEvents = useLiveQuery(() => repo.getEvents(300)) || [];
  const projects = useLiveQuery(() => repo.getProjects()) || [];

  // Evening Close reconciliation state
  const [reconcileIndex, setReconcileIndex] = useState<number>(0);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileReason, setReconcileReason] = useState<FrictionCategory>('AVOIDING_IT');
  const [reconcileNote, setReconcileNote] = useState('');
  const [isWIPModalOpen, setIsWIPModalOpen] = useState(false);

  // Compute daily and weekly metrics
  const dailyMetrics = MetricsEngine.calculateDailyMetrics(commitment, allTasks);
  const weeklyReview = MetricsEngine.calculateOperationsReview(
    allTasks,
    allCommitments,
    allEvents,
    projects
  );

  const taskMap = new Map(allTasks.map(t => [t.id, t]));
  const committedItems = commitment?.tasks || [];
  const incompleteItems = committedItems.filter(i => !i.completed && !i.deferred);

  const currentReconcileItem = incompleteItems[reconcileIndex];
  const currentReconcileTask = currentReconcileItem ? taskMap.get(currentReconcileItem.taskId) : null;

  // Handle single item reconciliation
  const handleReconcileAction = async (action: 'COMPLETE_NOW' | 'MOVE_TO_TOMORROW' | 'BREAK_DOWN' | 'DELETE') => {
    if (!currentReconcileTask) return;

    await repo.reconcileDay(todayDate, [
      {
        taskId: currentReconcileTask.id,
        action,
        reason: reconcileReason,
        note: reconcileNote.trim() || undefined
      }
    ]);

    setReconcileNote('');
    if (reconcileIndex + 1 < incompleteItems.length) {
      setReconcileIndex(prev => prev + 1);
    } else {
      setIsReconciling(false);
      setReconcileIndex(0);
    }
  };

  const handleStartReconciliation = () => {
    setReconcileIndex(0);
    setIsReconciling(true);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 pt-2">
      {/* Header & Sub-tab Switcher */}
      <div className="border-b border-console-border pb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-console-muted uppercase">
            Behavioural Integrity
          </div>
          <h1 className="text-lg font-bold text-console-text">
            Operational Review
          </h1>
        </div>

        <div className="flex bg-console-surface border border-console-border rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('daily')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'daily'
                ? 'bg-console-card text-console-text font-bold shadow-sm'
                : 'text-console-muted hover:text-console-text'
            }`}
          >
            Day Close
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('weekly')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
              activeSubTab === 'weekly'
                ? 'bg-console-card text-console-text font-bold shadow-sm'
                : 'text-console-muted hover:text-console-text'
            }`}
          >
            Operations
          </button>
        </div>
      </div>

      {activeSubTab === 'daily' ? (
        /* DAILY CLOSE & RECONCILIATION */
        <div className="flex-1 flex flex-col space-y-4">
          {/* Commitment Integrity Card */}
          <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-console-muted">
                Daily Commitment Integrity
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {dailyMetrics.integrityRate}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-b border-console-border/60">
              <div>
                <div className="text-lg font-mono font-bold text-console-text">
                  {dailyMetrics.totalCommitted}
                </div>
                <div className="text-[10px] font-mono uppercase text-console-muted">Committed</div>
              </div>
              <div>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {dailyMetrics.totalCompleted}
                </div>
                <div className="text-[10px] font-mono uppercase text-console-muted">Completed</div>
              </div>
              <div>
                <div className="text-lg font-mono font-bold text-amber-400">
                  {dailyMetrics.totalDeferred + incompleteItems.length}
                </div>
                <div className="text-[10px] font-mono uppercase text-console-muted">Unresolved</div>
              </div>
            </div>

            <p className="text-[11px] text-console-muted mt-2.5">
              Integrity is purely an operational ratio of completed commitments, not a moral score.
            </p>
          </div>

          {/* Reconciliation Flow */}
          {incompleteItems.length > 0 && !isReconciling && (
            <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-amber-400 mb-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <h3 className="text-xs font-mono font-semibold uppercase">
                  {incompleteItems.length} Unresolved Commitments
                </h3>
              </div>
              <p className="text-xs text-console-muted mb-3">
                Commitments cannot be silently swept under the rug. Reconcile what happened before closing today.
              </p>
              <button
                type="button"
                onClick={handleStartReconciliation}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition-colors"
              >
                Start Evening Reconciliation
              </button>
            </div>
          )}

          {/* Active Reconciliation Wizard */}
          {isReconciling && currentReconcileTask && (
            <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-mono text-console-muted mb-2">
                <span>RECONCILING ({reconcileIndex + 1} of {incompleteItems.length})</span>
                <button
                  type="button"
                  onClick={() => setIsReconciling(false)}
                  className="hover:text-console-text"
                >
                  Close
                </button>
              </div>

              <div className="text-sm font-semibold text-console-text mb-1 bg-console-card p-2.5 rounded border border-console-border">
                {currentReconcileTask.title}
              </div>

              <p className="text-xs font-mono uppercase text-console-muted mb-2 pt-2">
                What happened? (Select reason)
              </p>

              <select
                value={reconcileReason}
                onChange={e => setReconcileReason(e.target.value as FrictionCategory)}
                className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-xs text-console-text focus:outline-none focus:border-console-accent mb-3"
              >
                <option value="AVOIDING_IT">Avoiding it (Internal reluctance)</option>
                <option value="UNDERESTIMATED">Underestimated time required</option>
                <option value="INTERRUPTED">Interrupted by urgent work</option>
                <option value="TOO_BIG">Scope was too big</option>
                <option value="DONT_KNOW_HOW">Unclear execution step</option>
                <option value="NOT_IMPORTANT">No longer high priority</option>
                <option value="OTHER">Other circumstances</option>
              </select>

              <input
                type="text"
                value={reconcileNote}
                onChange={e => setReconcileNote(e.target.value)}
                placeholder="Optional detail..."
                className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent mb-4"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleReconcileAction('COMPLETE_NOW')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono uppercase font-semibold"
                >
                  Complete Now (Late)
                </button>
                <button
                  type="button"
                  onClick={() => handleReconcileAction('MOVE_TO_TOMORROW')}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono uppercase font-semibold"
                >
                  Move to Tomorrow (Increment Deferral)
                </button>
                <button
                  type="button"
                  onClick={() => handleReconcileAction('BREAK_DOWN')}
                  className="w-full py-2 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-lg text-xs font-mono uppercase font-semibold"
                >
                  Break into 15-min Micro Step
                </button>
                <button
                  type="button"
                  onClick={() => handleReconcileAction('DELETE')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono uppercase font-semibold"
                >
                  Drop with Reason
                </button>
              </div>
            </div>
          )}

          {/* Today's Audit Trail */}
          <div className="bg-console-card/40 border border-console-border rounded-xl p-3.5">
            <h3 className="text-xs font-mono uppercase text-console-muted mb-2">
              Today's Commitment State
            </h3>
            <div className="space-y-1.5">
              {committedItems.map(item => {
                const task = taskMap.get(item.taskId);
                return (
                  <div key={item.taskId} className="text-xs flex items-center justify-between py-1 border-b border-console-border/40 last:border-0">
                    <span className="text-console-text truncate max-w-[240px]">
                      {task?.title || item.taskId}
                    </span>
                    <span className="font-mono text-[11px]">
                      {item.completed ? (
                        <span className="text-emerald-400">✓ Completed</span>
                      ) : item.deferred ? (
                        <span className="text-amber-400">⚠ Deferred</span>
                      ) : (
                        <span className="text-console-muted">Pending</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* OPERATIONS REVIEW & BEHAVIOURAL PATTERNS */
        <div className="flex-1 flex flex-col space-y-4">
          {/* Operations Reliability Metrics */}
          <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-wider text-console-accent font-semibold mb-3">
              Reliability Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-console-card p-3 rounded-lg border border-console-border">
                <span className="text-console-muted uppercase text-[10px] block mb-1">
                  Avg Start Delay
                </span>
                <span className="text-base font-bold text-console-text">
                  {weeklyReview.avgStartDelayMinutes} mins
                </span>
              </div>

              <div className="bg-console-card p-3 rounded-lg border border-console-border">
                <span className="text-console-muted uppercase text-[10px] block mb-1">
                  Duration vs Estimate
                </span>
                <span className="text-base font-bold text-console-text">
                  {weeklyReview.avgDurationRatio}x
                </span>
              </div>

              <div className="bg-console-card p-3 rounded-lg border border-console-border">
                <span className="text-console-muted uppercase text-[10px] block mb-1">
                  Overall Integrity
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {weeklyReview.integrityRate}%
                </span>
              </div>

              <div className="bg-console-card p-3 rounded-lg border border-console-border">
                <span className="text-console-muted uppercase text-[10px] block mb-1">
                  P0 Completion Rate
                </span>
                <span className="text-base font-bold text-red-400">
                  {weeklyReview.p0IntegrityRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Friction Engine Analysis */}
          <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-console-text mb-3">
              <HelpCircle className="w-4 h-4 text-console-accent" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
                Friction Diagnosis Breakdown
              </h3>
            </div>

            {weeklyReview.topFrictionCategory ? (
              <div className="mb-3 bg-console-card p-2.5 rounded-lg border border-console-border text-xs">
                <span className="text-console-muted text-[10px] uppercase font-mono block">
                  Top Recurring Blocker:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {weeklyReview.topFrictionCategory}
                </span>
                <span className="text-console-muted block text-[11px] mt-0.5">
                  ({FrictionEngine.getHumanFrictionDescription(weeklyReview.topFrictionCategory)})
                </span>
              </div>
            ) : (
              <p className="text-xs text-console-muted mb-3">
                No recurring friction diagnosed yet.
              </p>
            )}

            <div className="space-y-1 text-xs font-mono">
              {Object.entries(weeklyReview.frictionCounts).map(([cat, count]) => (
                <div key={cat} className="flex justify-between py-1 border-b border-console-border/40 last:border-0">
                  <span className="text-console-muted">{cat}</span>
                  <span className="font-bold text-console-text">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deferral Debt List */}
          <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Deferral Debt (Stalled ≥ 3x)
                </h3>
              </div>
              <span className="text-xs font-mono text-console-muted">
                {weeklyReview.deferralDebtTasks.length} items
              </span>
            </div>

            {weeklyReview.deferralDebtTasks.length === 0 ? (
              <p className="text-xs text-console-muted">
                No tasks currently in deferral debt. Commitments are moving forward.
              </p>
            ) : (
              <div className="space-y-2">
                {weeklyReview.deferralDebtTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-2.5 bg-red-950/20 border border-red-800/60 rounded-lg flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-medium text-console-text truncate">
                        {task.title}
                      </div>
                      <span className="text-[10px] font-mono text-red-400">
                        Deferred {task.deferralCount} times
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Work-in-Progress (WIP) Project Audit */}
          <div className="bg-console-surface border border-console-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-console-text">
                <Layers className="w-4 h-4 text-console-accent" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Active WIP Projects
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-console-accent">
                {weeklyReview.activeProjectsCount} / {weeklyReview.wipLimit} Limit
              </span>
            </div>

            <p className="text-xs text-console-muted mb-3">
              Enforcing max 5 active projects protects against parallel interest overload.
            </p>

            <div className="space-y-1.5">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-2 rounded bg-console-card border border-console-border text-xs"
                >
                  <span className="text-console-text truncate">{proj.name}</span>
                  <span className={`text-[10px] font-mono uppercase font-semibold ${
                    proj.status === 'active' ? 'text-emerald-400' : 'text-console-muted'
                  }`}>
                    {proj.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WIP Limit Guard Modal */}
      <WIPLimitModal
        isOpen={isWIPModalOpen}
        activeProjects={projects.filter(p => p.status === 'active')}
        onSuccess={() => setIsWIPModalOpen(false)}
        onCancel={() => setIsWIPModalOpen(false)}
      />
    </div>
  );
};
