import React, { useState, useEffect } from 'react';
import { X, Check, Target } from 'lucide-react';
import { PriorityLevel } from '../../core/types/domain';
import { repo } from '../../core/storage/localRepo';
import { useLiveQuery } from 'dexie-react-hooks';

interface TaskCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultPriority?: PriorityLevel;
}

export const TaskCompilerModal: React.FC<TaskCompilerModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultPriority = 'P1'
}) => {
  const [title, setTitle] = useState('');
  const [microAction, setMicroAction] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(30);
  const [priority, setPriority] = useState<PriorityLevel>(defaultPriority);
  const [projectId, setProjectId] = useState<string>('');
  const [areaId, setAreaId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projects = useLiveQuery(() => repo.getProjects()) || [];
  const areas = useLiveQuery(() => repo.getAreas()) || [];

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setMicroAction('');
      setEstimatedMinutes(30);
      setPriority(defaultPriority);
      setProjectId('');
      setAreaId('');
    }
  }, [isOpen, defaultPriority]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await repo.createTask({
        title: title.trim(),
        microAction: microAction.trim() || undefined,
        estimatedMinutes,
        priority,
        projectId: projectId || undefined,
        areaId: areaId || undefined
      });
      onCreated?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const effortChips = [15, 30, 45, 60, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-console-surface border border-console-border rounded-xl p-5 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-console-accent">
            <Target className="w-4 h-4" />
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
              Lightweight Task Creator
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-console-muted hover:text-console-text p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs uppercase font-mono text-console-muted mb-1">
              Concrete Action <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Implement shipment data parser"
              className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-sm text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent"
            />
          </div>

          {/* Micro-Action to lower start resistance */}
          <div>
            <label className="block text-xs uppercase font-mono text-console-muted mb-1">
              First 2-Minute Physical Step (Optional)
            </label>
            <input
              type="text"
              value={microAction}
              onChange={e => setMicroAction(e.target.value)}
              placeholder="e.g. Open parser.ts and write input types"
              className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent"
            />
            <p className="text-[11px] text-console-muted mt-1">
              Reduces startup inertia when you transition to execution.
            </p>
          </div>

          {/* Effort Estimate Chips */}
          <div>
            <label className="block text-xs uppercase font-mono text-console-muted mb-1.5">
              Estimated Effort
            </label>
            <div className="flex flex-wrap gap-2">
              {effortChips.map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setEstimatedMinutes(minutes)}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    estimatedMinutes === minutes
                      ? 'bg-console-accent text-white font-semibold'
                      : 'bg-console-card text-console-muted hover:text-console-text border border-console-border'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs uppercase font-mono text-console-muted mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('P0')}
                className={`py-2 px-2 rounded text-xs font-mono border transition-all text-center ${
                  priority === 'P0'
                    ? 'bg-red-950/80 border-red-500 text-red-300 font-semibold'
                    : 'bg-console-card border-console-border text-console-muted'
                }`}
              >
                P0 (Critical)
              </button>
              <button
                type="button"
                onClick={() => setPriority('P1')}
                className={`py-2 px-2 rounded text-xs font-mono border transition-all text-center ${
                  priority === 'P1'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-console-card border-console-border text-console-muted'
                }`}
              >
                P1 (Important)
              </button>
              <button
                type="button"
                onClick={() => setPriority('P2')}
                className={`py-2 px-2 rounded text-xs font-mono border transition-all text-center ${
                  priority === 'P2'
                    ? 'bg-slate-800 border-slate-500 text-slate-300 font-semibold'
                    : 'bg-console-card border-console-border text-console-muted'
                }`}
              >
                P2 (Optional)
              </button>
            </div>
          </div>

          {/* Optional Project & Area */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] uppercase font-mono text-console-muted mb-1">
                Area (Optional)
              </label>
              <select
                value={areaId}
                onChange={e => setAreaId(e.target.value)}
                className="w-full bg-console-card border border-console-border rounded-lg px-2.5 py-1.5 text-xs text-console-text focus:outline-none focus:border-console-accent"
              >
                <option value="">None</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase font-mono text-console-muted mb-1">
                Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-console-card border border-console-border rounded-lg px-2.5 py-1.5 text-xs text-console-text focus:outline-none focus:border-console-accent"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-console-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-console-muted hover:text-console-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-5 py-2.5 bg-console-accent hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-xs font-mono uppercase font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

