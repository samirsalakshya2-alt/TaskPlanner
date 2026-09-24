import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, Pause, CheckCircle2, HelpCircle, ArrowLeft, Clock } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';
import { FrictionCategory } from '../../core/types/domain';
import { useExecutionTimer } from '../../hooks/useExecutionTimer';
import { FrictionModal } from '../../components/dialogs/FrictionModal';

interface NowScreenProps {
  initialTaskId?: string | null;
  onBackToToday: () => void;
}

export const NowScreen: React.FC<NowScreenProps> = ({
  initialTaskId,
  onBackToToday
}) => {
  const {
    activeTaskId,
    isRunning,
    elapsedSeconds,
    startTask,
    pauseTimer,
    resumeTimer,
    completeActiveTask,
    selectTaskToExecute
  } = useExecutionTimer();

  // If initialTaskId provided and no task is currently active/running, select it
  const currentTaskId = activeTaskId || initialTaskId;

  const currentTask = useLiveQuery(
    () => (currentTaskId ? repo.getTask(currentTaskId) : undefined),
    [currentTaskId]
  );

  const todayDate = new Date().toISOString().slice(0, 10);
  const commitment = useLiveQuery(() => repo.getCommitmentForDate(todayDate), [todayDate]);
  const allTasks = useLiveQuery(() => repo.getBacklogTasks()) || [];

  const [evidenceNote, setEvidenceNote] = useState('');
  const [showEvidenceInput, setShowEvidenceInput] = useState(false);
  const [isFrictionModalOpen, setIsFrictionModalOpen] = useState(false);
  const [tempMicroStep, setTempMicroStep] = useState('');

  // Format seconds to MM:SS or HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!currentTaskId) return;
    if (tempMicroStep.trim() && currentTask && !currentTask.microAction) {
      await repo.updateTask(currentTaskId, { microAction: tempMicroStep.trim() });
    }
    await startTask(currentTaskId);
  };

  const handleComplete = async () => {
    await completeActiveTask(evidenceNote.trim() || undefined);
    setShowEvidenceInput(false);
    setEvidenceNote('');
    onBackToToday();
  };

  const handleFrictionDiagnosed = async (cat: FrictionCategory, note?: string) => {
    if (currentTaskId) {
      await repo.recordFriction(currentTaskId, cat, note);
    }
    setIsFrictionModalOpen(false);
  };

  // If no task selected yet, allow picking from today's locked commitments
  if (!currentTask) {
    const candidateTasks = (commitment?.tasks || []).filter(t => !t.completed);

    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 text-center">
        <Clock className="w-12 h-12 text-console-muted mb-4 stroke-1" />
        <h2 className="text-base font-bold text-console-text mb-1">
          No Task in Execution
        </h2>
        <p className="text-xs text-console-muted mb-6 max-w-xs">
          Select an active commitment to enter the distraction-free execution console.
        </p>

        {candidateTasks.length > 0 ? (
          <div className="w-full space-y-2 max-w-xs">
            {candidateTasks.map(item => {
              const task = allTasks.find(t => t.id === item.taskId);
              return (
                <button
                  key={item.taskId}
                  type="button"
                  onClick={() => selectTaskToExecute(item.taskId)}
                  className="w-full p-3 bg-console-surface border border-console-border hover:border-console-accent text-left rounded-xl transition-colors active:scale-95"
                >
                  <div className="text-xs font-semibold text-console-text truncate">
                    {task?.title || 'Committed Task'}
                  </div>
                  <div className="text-[10px] font-mono text-console-muted mt-1">
                    {task?.estimatedMinutes ? `${task.estimatedMinutes}m effort` : 'Flexible'}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={onBackToToday}
            className="px-5 py-2.5 bg-console-card border border-console-border text-console-text rounded-lg text-xs font-mono uppercase font-semibold"
          >
            Go to Today Screen
          </button>
        )}
      </div>
    );
  }

  // Calculate start delay if planned
  let startDelayMinutes: number | null = null;
  if (currentTask.plannedStart) {
    const planned = new Date(currentTask.plannedStart).getTime();
    const now = Date.now();
    startDelayMinutes = Math.max(0, Math.round((now - planned) / 60000));
  }

  return (
    <div className="flex-1 flex flex-col justify-between py-2">
      {/* Top minimal header */}
      <div className="flex items-center justify-between border-b border-console-border pb-3">
        <button
          type="button"
          onClick={onBackToToday}
          className="text-xs font-mono text-console-muted hover:text-console-text flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Commitments</span>
        </button>
        <span className="text-[11px] font-mono uppercase tracking-widest text-console-accent font-semibold">
          {isRunning ? 'IN PROGRESS' : 'NOW CONSOLE'}
        </span>
      </div>

      {/* Main Execution Body (Interface Disappears During Work) */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-2 my-auto">
        <h1 className="text-xl font-bold text-console-text max-w-sm mb-3">
          {currentTask.title}
        </h1>

        {/* Start-Resistance Breaker: First 2-minute physical step */}
        {currentTask.microAction ? (
          <div className="w-full max-w-xs bg-console-card/90 border border-console-border rounded-xl p-3.5 mb-6 text-left shadow-sm">
            <span className="text-[10px] uppercase font-mono font-bold text-console-accent tracking-wider block mb-1">
              First 2-minute physical step
            </span>
            <p className="text-xs text-console-text">
              {currentTask.microAction}
            </p>
          </div>
        ) : !isRunning ? (
          <div className="w-full max-w-xs mb-6 text-left">
            <label className="text-[11px] uppercase font-mono text-console-muted block mb-1">
              Overcome Resistance (First 2-minute step)
            </label>
            <input
              type="text"
              value={tempMicroStep}
              onChange={e => setTempMicroStep(e.target.value)}
              placeholder="e.g. Open terminal and run build..."
              className="w-full bg-console-card border border-console-border rounded-lg px-3 py-2 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent"
            />
          </div>
        ) : null}

        {/* Stopwatch Display */}
        <div className="my-4">
          <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-console-text">
            {formatTimer(elapsedSeconds)}
          </div>
          {currentTask.estimatedMinutes && (
            <div className="text-xs font-mono text-console-muted mt-2">
              Target: {currentTask.estimatedMinutes}m
              {startDelayMinutes !== null && startDelayMinutes > 0 && (
                <span className="ml-2 text-amber-400">
                  (+{startDelayMinutes}m start delay)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Execution Controls */}
      <div className="w-full max-w-sm mx-auto space-y-3 pb-2">
        {!isRunning && elapsedSeconds === 0 ? (
          /* Ready to Start State */
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 bg-console-accent hover:bg-blue-600 text-white rounded-xl text-sm font-mono uppercase font-bold tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Execution</span>
          </button>
        ) : (
          /* Running or Paused State */
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              {isRunning ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="py-3.5 bg-console-card hover:bg-console-card/80 border border-console-border text-console-text rounded-xl text-xs font-mono uppercase font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="py-3.5 bg-console-accent hover:bg-blue-600 text-white rounded-xl text-xs font-mono uppercase font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowEvidenceInput(true)}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono uppercase font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-transform shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete</span>
              </button>
            </div>

            {/* Unobtrusive Friction Trigger */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsFrictionModalOpen(true)}
                className="text-xs font-mono text-console-muted hover:text-amber-400 flex items-center space-x-1 py-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Encountering friction / I'm stuck</span>
              </button>
            </div>
          </div>
        )}

        {/* Evidence note prompt on completion */}
        {showEvidenceInput && (
          <div className="bg-console-card border border-console-border rounded-xl p-3.5 animate-in fade-in duration-150 text-left">
            <label className="block text-xs font-mono uppercase text-console-muted mb-1.5">
              Completion Artifact / Note (Optional)
            </label>
            <input
              type="text"
              autoFocus
              value={evidenceNote}
              onChange={e => setEvidenceNote(e.target.value)}
              placeholder="e.g. Commit hash, link, or outcome note"
              className="w-full bg-console-bg border border-console-border rounded-lg px-3 py-2 text-xs text-console-text placeholder-console-muted/60 focus:outline-none focus:border-emerald-500 mb-3"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEvidenceInput(false)}
                className="px-3 py-1.5 text-xs font-mono text-console-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-mono uppercase font-bold rounded-lg"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Friction Modal */}
      <FrictionModal
        isOpen={isFrictionModalOpen}
        taskTitle={currentTask.title}
        onSelectCategory={handleFrictionDiagnosed}
        onClose={() => setIsFrictionModalOpen(false)}
      />
    </div>
  );
};

