import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Task } from '../../core/types/domain';

interface DeferralDebtModalProps {
  isOpen: boolean;
  task: Task | null;
  onAction: (action: 'DO_TODAY' | 'MICRO_STEP' | 'REDESIGN' | 'DELETE') => void;
  onDismiss: () => void;
}

export const DeferralDebtModal: React.FC<DeferralDebtModalProps> = ({
  isOpen,
  task,
  onAction,
  onDismiss
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-console-surface border border-red-500/70 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 text-red-400 mb-2">
          <AlertOctagon className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
            Deferral Debt Intervention
          </h3>
        </div>

        <p className="text-xs text-console-muted mb-1">
          This task has been deferred <span className="text-red-400 font-bold">{task.deferralCount} times</span> without completion:
        </p>
        <p className="text-sm font-semibold text-console-text mb-2 bg-console-card p-2.5 rounded border border-console-border">
          "{task.title}"
        </p>

        <p className="text-xs text-console-muted mb-4">
          Endless postponement hides avoidance. What should happen right now?
        </p>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => onAction('DO_TODAY')}
            className="w-full py-2.5 px-3 bg-red-950/60 hover:bg-red-900/60 border border-red-700/80 text-red-200 rounded-lg text-xs font-mono font-semibold text-left transition-colors flex items-center justify-between"
          >
            <span>[ DO IT ] Commit as sole P0 today</span>
            <span className="text-[10px] text-red-400">Force execution</span>
          </button>

          <button
            type="button"
            onClick={() => onAction('MICRO_STEP')}
            className="w-full py-2.5 px-3 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-lg text-xs font-mono text-left transition-colors flex items-center justify-between"
          >
            <span>[ BREAK IT DOWN ] Create 15-min micro-step</span>
            <span className="text-[10px] text-console-muted">Lower friction</span>
          </button>

          <button
            type="button"
            onClick={() => onAction('REDESIGN')}
            className="w-full py-2.5 px-3 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-lg text-xs font-mono text-left transition-colors flex items-center justify-between"
          >
            <span>[ REDESIGN ] Change completion condition</span>
            <span className="text-[10px] text-console-muted">Clarify outcome</span>
          </button>

          <button
            type="button"
            onClick={() => onAction('DELETE')}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono text-left transition-colors flex items-center justify-between"
          >
            <span>[ DELETE ] Admit it is not happening</span>
            <span className="text-[10px] text-slate-400">Drop honesty</span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-mono text-console-muted hover:text-console-text"
          >
            Decide during evening close
          </button>
        </div>
      </div>
    </div>
  );
};

