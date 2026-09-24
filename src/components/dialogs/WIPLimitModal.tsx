import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Project } from '../../core/types/domain';
import { repo } from '../../core/storage/localRepo';

interface WIPLimitModalProps {
  isOpen: boolean;
  activeProjects: Project[];
  pendingProjectName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const WIPLimitModal: React.FC<WIPLimitModalProps> = ({
  isOpen,
  activeProjects,
  pendingProjectName,
  onSuccess,
  onCancel
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [chosenAction, setChosenAction] = useState<Project['status']>('paused');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedProjectId) return;
    await repo.updateProjectStatus(selectedProjectId, chosenAction);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-console-surface border border-amber-600/70 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
              WIP Guard • Active Project Limit Reached
            </h3>
          </div>
          <button type="button" onClick={onCancel} className="text-console-muted hover:text-console-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-console-muted mb-2">
          You already have <span className="font-bold text-console-text">{activeProjects.length} active projects</span> (the system limit is {activeProjects.length}).
          {pendingProjectName && ` To activate "${pendingProjectName}", you must free up a slot.`}
        </p>
        <p className="text-xs font-mono font-medium text-amber-300 mb-3">
          Which project should leave active WIP?
        </p>

        <div className="space-y-2 mb-4 max-h-[35vh] overflow-y-auto">
          {activeProjects.map(proj => (
            <label
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedProjectId === proj.id
                  ? 'bg-amber-950/40 border-amber-500 text-console-text'
                  : 'bg-console-card border-console-border text-console-muted hover:border-console-border/80'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="radio"
                  name="activeProjectSwap"
                  checked={selectedProjectId === proj.id}
                  onChange={() => setSelectedProjectId(proj.id)}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-mono font-medium text-console-text">{proj.name}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Action Choice for the chosen project */}
        <div className="mb-4">
          <label className="block text-[11px] uppercase font-mono text-console-muted mb-1.5">
            Action on selected project:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setChosenAction('paused')}
              className={`py-1.5 px-2 rounded text-xs font-mono border transition-all text-center ${
                chosenAction === 'paused'
                  ? 'bg-console-accent text-white border-console-accent'
                  : 'bg-console-card border-console-border text-console-muted'
              }`}
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => setChosenAction('completed')}
              className={`py-1.5 px-2 rounded text-xs font-mono border transition-all text-center ${
                chosenAction === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-console-card border-console-border text-console-muted'
              }`}
            >
              Complete
            </button>
            <button
              type="button"
              onClick={() => setChosenAction('archived')}
              className={`py-1.5 px-2 rounded text-xs font-mono border transition-all text-center ${
                chosenAction === 'archived'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-console-card border-console-border text-console-muted'
              }`}
            >
              Archive
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono uppercase text-console-muted hover:text-console-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono uppercase font-semibold transition-colors"
          >
            Update WIP & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

