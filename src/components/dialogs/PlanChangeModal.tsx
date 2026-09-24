import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { FrictionCategory } from '../../core/types/domain';

interface PlanChangeModalProps {
  isOpen: boolean;
  taskTitle: string;
  onConfirm: (reason: FrictionCategory, note?: string) => void;
  onCancel: () => void;
}

const REASON_OPTIONS: { id: FrictionCategory; label: string; description: string }[] = [
  { id: 'AVOIDING_IT', label: 'Avoiding task', description: 'Internal reluctance, resistance, or discomfort' },
  { id: 'INTERRUPTED', label: 'Unexpected work', description: 'Urgent interruption or competing priority' },
  { id: 'UNDERESTIMATED', label: 'Underestimated effort', description: 'Takes substantially longer than anticipated' },
  { id: 'DONT_KNOW_HOW', label: 'Task unclear / ambiguous', description: 'Missing information or unclear physical next step' },
  { id: 'TOO_BIG', label: 'Scope is too large', description: 'Needs to be broken into smaller discrete units' },
  { id: 'NOT_IMPORTANT', label: 'No longer important', description: 'Priorities shifted or outcome rendered obsolete' },
  { id: 'OTHER', label: 'Other', description: 'Circumstances not covered above' }
];

export const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  isOpen,
  taskTitle,
  onConfirm,
  onCancel
}) => {
  const [selectedReason, setSelectedReason] = useState<FrictionCategory>('AVOIDING_IT');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedReason, note.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-console-surface border border-red-900/60 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 text-amber-400 mb-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
            Anti-Bypass Guard • Plan Modification
          </h3>
        </div>

        <p className="text-xs text-console-muted mb-1">
          You are changing a locked commitment:
        </p>
        <p className="text-sm font-semibold text-console-text mb-4 bg-console-card p-2 rounded border border-console-border">
          "{taskTitle}"
        </p>

        <p className="text-xs font-mono uppercase text-console-muted mb-2">
          Why is the plan changing? (Records behavioral truth)
        </p>

        <div className="space-y-1.5 mb-4 max-h-[40vh] overflow-y-auto pr-1">
          {REASON_OPTIONS.map(opt => (
            <label
              key={opt.id}
              onClick={() => setSelectedReason(opt.id)}
              className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedReason === opt.id
                  ? 'bg-amber-950/40 border-amber-500/70 text-console-text'
                  : 'bg-console-card border-console-border text-console-muted hover:border-console-border/80'
              }`}
            >
              <input
                type="radio"
                name="planChangeReason"
                checked={selectedReason === opt.id}
                onChange={() => setSelectedReason(opt.id)}
                className="mt-0.5 text-amber-500 focus:ring-amber-500"
              />
              <div className="ml-2.5">
                <div className="text-xs font-mono font-medium text-console-text">{opt.label}</div>
                <div className="text-[11px] text-console-muted">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note / context..."
          className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent mb-4"
        />

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono uppercase text-console-muted hover:text-console-text"
          >
            Keep Plan
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono uppercase font-semibold transition-colors"
          >
            Record Truth & Change
          </button>
        </div>
      </div>
    </div>
  );
};

