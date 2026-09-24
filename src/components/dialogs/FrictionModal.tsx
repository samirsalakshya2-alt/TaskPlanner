import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { FrictionCategory } from '../../core/types/domain';

interface FrictionModalProps {
  isOpen: boolean;
  taskTitle: string;
  onSelectCategory: (category: FrictionCategory, note?: string) => void;
  onClose: () => void;
}

const CATEGORIES: { id: FrictionCategory; label: string }[] = [
  { id: 'TOO_BIG', label: 'Too big' },
  { id: 'DONT_KNOW_HOW', label: "Don't know how" },
  { id: 'AVOIDING_IT', label: 'Avoiding it' },
  { id: 'INTERRUPTED', label: 'Interrupted' },
  { id: 'UNDERESTIMATED', label: 'Underestimated' },
  { id: 'NOT_IMPORTANT', label: 'Not important anymore' },
  { id: 'OTHER', label: 'Other' }
];

export const FrictionModal: React.FC<FrictionModalProps> = ({
  isOpen,
  taskTitle,
  onSelectCategory,
  onClose
}) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-console-surface border border-console-border rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-console-accent">
            <HelpCircle className="w-4 h-4" />
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
              Friction Diagnosis
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-console-muted hover:text-console-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-console-muted mb-1">What's blocking you on:</p>
        <p className="text-xs font-semibold text-console-text truncate mb-4 bg-console-card p-2 rounded">
          {taskTitle}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id, note.trim() || undefined)}
              className="py-2.5 px-3 bg-console-card hover:bg-console-card/80 border border-console-border hover:border-console-accent text-console-text rounded-lg text-xs font-mono text-left transition-colors active:scale-95"
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional detail..."
          className="w-full bg-console-card border border-console-border rounded-lg px-3 py-1.5 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent"
        />
      </div>
    </div>
  );
};

