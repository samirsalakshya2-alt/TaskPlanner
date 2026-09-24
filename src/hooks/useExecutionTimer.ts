import { useState, useEffect, useRef, useCallback } from 'react';
import { repo } from '../core/storage/localRepo';

interface TimerState {
  activeTaskId: string | null;
  isRunning: boolean;
  startEpochMs: number | null;
  accumulatedSeconds: number;
}

const STORAGE_KEY = 'exec_timer_state_v1';

export function useExecutionTimer() {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      activeTaskId: null,
      isRunning: false,
      startEpochMs: null,
      accumulatedSeconds: 0
    };
  });

  const [displaySeconds, setDisplaySeconds] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
    } catch {
      // Ignore
    }
  }, [timerState]);

  // Compute live elapsed seconds
  const calculateElapsed = useCallback(() => {
    if (!timerState.isRunning || !timerState.startEpochMs) {
      return timerState.accumulatedSeconds;
    }
    const deltaSeconds = Math.floor((Date.now() - timerState.startEpochMs) / 1000);
    return timerState.accumulatedSeconds + Math.max(0, deltaSeconds);
  }, [timerState]);

  // Update display ticker
  useEffect(() => {
    setDisplaySeconds(calculateElapsed());

    if (!timerState.isRunning) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const interval = setInterval(() => {
      setDisplaySeconds(calculateElapsed());
    }, 500);

    // iOS Safari visibility change handler: recalculate instantly when coming back from lock screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setDisplaySeconds(calculateElapsed());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerState, calculateElapsed]);

  const startTask = async (taskId: string) => {
    const { startDelayMinutes } = await repo.startTask(taskId);
    setTimerState({
      activeTaskId: taskId,
      isRunning: true,
      startEpochMs: Date.now(),
      accumulatedSeconds: 0
    });
    return { startDelayMinutes };
  };

  const pauseTimer = async () => {
    if (!timerState.activeTaskId || !timerState.isRunning) return;
    const totalElapsed = calculateElapsed();
    await repo.pauseTask(timerState.activeTaskId, totalElapsed);

    setTimerState({
      activeTaskId: timerState.activeTaskId,
      isRunning: false,
      startEpochMs: null,
      accumulatedSeconds: totalElapsed
    });
  };

  const resumeTimer = async () => {
    if (!timerState.activeTaskId || timerState.isRunning) return;
    await repo.resumeTask(timerState.activeTaskId);

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startEpochMs: Date.now()
    }));
  };

  const completeActiveTask = async (evidenceNote?: string) => {
    if (!timerState.activeTaskId) return;
    const totalElapsed = calculateElapsed();
    const taskId = timerState.activeTaskId;

    await repo.completeTask(taskId, totalElapsed, evidenceNote);

    setTimerState({
      activeTaskId: null,
      isRunning: false,
      startEpochMs: null,
      accumulatedSeconds: 0
    });

    return { taskId, totalElapsed };
  };

  const resetTimer = () => {
    setTimerState({
      activeTaskId: null,
      isRunning: false,
      startEpochMs: null,
      accumulatedSeconds: 0
    });
  };

  const selectTaskToExecute = (taskId: string) => {
    setTimerState({
      activeTaskId: taskId,
      isRunning: false,
      startEpochMs: null,
      accumulatedSeconds: 0
    });
  };

  return {
    activeTaskId: timerState.activeTaskId,
    isRunning: timerState.isRunning,
    elapsedSeconds: displaySeconds,
    startTask,
    pauseTimer,
    resumeTimer,
    completeActiveTask,
    resetTimer,
    selectTaskToExecute
  };
}

