import React, { useState } from 'react';
import { Compass, X } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';

interface CheckInModalProps {
  isOpen: boolean;
  activeTaskTitle?: string;
  onClose: () => void;
}

type CheckInActivity = 'PLANNED_TASK' | 'ANOTHER_TASK' | 'BREAK' | 'DISTRACTED';

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  activeTaskTitle,
  onClose
}) => {
  const [step, setStep] = useState<'activity' | 'driftImportance'>('activity');
  const [selectedActivity, setSelectedActivity] = useState<CheckInActivity | null>(null);

  if (!isOpen) return null;

  const handleActivitySelect = async (activity: CheckInActivity) => {
    setSelectedActivity(activity);
    if (activity === 'ANOTHER_TASK') {
      setStep('driftImportance');
    } else {
      await repo.recordEvent('CHECKIN_RECORDED', 'checkin', 'checkin-' + Date.now(), {
        activity,
        activeTaskTitle
      });
      onClose();
      setStep('activity');
    }
  };

  const handleImportanceSelect = async (importance: 'YES' | 'NO' | 'NOT_SURE') => {
    await repo.recordEvent('CHECKIN_RECORDED', 'checkin', 'checkin-' + Date.now(), {
      activity: selectedActivity,
      isMoreImportantThanPlan: importance === 'YES',
      importanceReasoning: importance,
      activeTaskTitle
    });
    onClose();
    setStep('activity');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-console-surface border border-console-border rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-console-accent">
            <Compass className="w-4 h-4" />
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
              Lightweight Check-In
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-console-muted hover:text-console-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'activity' ? (
          <>
            <p className="text-xs text-console-muted mb-4">
              Right now, what are you physically engaged in?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleActivitySelect('PLANNED_TASK')}
                className="w-full py-2.5 px-3 bg-console-card hover:bg-emerald-950/40 border border-console-border hover:border-emerald-600 text-console-text rounded-lg text-xs font-mono text-left transition-colors"
              >
                [ My planned task ] {activeTaskTitle ? `(${activeTaskTitle})` : ''}
              </button>

              <button
                type="button"
                onClick={() => handleActivitySelect('ANOTHER_TASK')}
                className="w-full py-2.5 px-3 bg-console-card hover:bg-amber-950/40 border border-console-border hover:border-amber-600 text-console-text rounded-lg text-xs font-mono text-left transition-colors"
              >
                [ Another task / Unplanned work ]
              </button>

              <button
                type="button"
                onClick={() => handleActivitySelect('BREAK')}
                className="w-full py-2.5 px-3 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-lg text-xs font-mono text-left transition-colors"
              >
                [ Deliberate break / Rest ]
              </button>

              <button
                type="button"
                onClick={() => handleActivitySelect('DISTRACTED')}
                className="w-full py-2.5 px-3 bg-console-card hover:bg-red-950/40 border border-console-border hover:border-red-600 text-console-text rounded-lg text-xs font-mono text-left transition-colors"
              >
                [ Distracted / Off-track ]
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-console-muted mb-2">Task drift detected.</p>
            <p className="text-xs font-mono font-medium text-console-text mb-4">
              Is this unplanned work genuinely more important than your locked commitment?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleImportanceSelect('YES')}
                className="w-full py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/70 text-emerald-200 rounded-lg text-xs font-mono font-semibold text-left transition-colors"
              >
                Yes — High genuine priority
              </button>

              <button
                type="button"
                onClick={() => handleImportanceSelect('NO')}
                className="w-full py-2.5 px-3 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/70 text-amber-200 rounded-lg text-xs font-mono font-semibold text-left transition-colors"
              >
                No — Novelty or avoidance drift
              </button>

              <button
                type="button"
                onClick={() => handleImportanceSelect('NOT_SURE')}
                className="w-full py-2.5 px-3 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-lg text-xs font-mono text-left transition-colors"
              >
                Not sure
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

