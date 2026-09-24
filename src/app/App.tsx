import React, { useState, useEffect } from 'react';
import { SafeScreen } from '../components/common/SafeScreen';
import { BottomNav, NavTab } from '../components/common/BottomNav';
import { TodayScreen } from '../screens/Today/TodayScreen';
import { NowScreen } from '../screens/Now/NowScreen';
import { InboxScreen } from '../screens/Inbox/InboxScreen';
import { ReviewScreen } from '../screens/Review/ReviewScreen';
import { NoveltyCaptureModal } from '../components/dialogs/NoveltyCaptureModal';
import { CheckInModal } from '../components/dialogs/CheckInModal';
import { useExecutionTimer } from '../hooks/useExecutionTimer';
import { repo } from '../core/storage/localRepo';
import { db } from '../core/storage/db';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [activeNowTaskId, setActiveNowTaskId] = useState<string | null>(null);
  const [isNoveltyModalOpen, setIsNoveltyModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const { isRunning, activeTaskId } = useExecutionTimer();

  // First-launch initialization and realistic seed
  useEffect(() => {
    const seedInitialIfEmpty = async () => {
      await repo.initializeDefaults();
      const taskCount = await db.tasks.count();
      if (taskCount === 0) {
        // Seed initial project
        const project = await repo.createProject('AI x Operations System');

        // Seed 3 realistic tasks
        await repo.createTask({
          title: 'Implement shipment-data ingestion parser',
          microAction: 'Open types.ts and define ShipmentPayload interface',
          estimatedMinutes: 30,
          priority: 'P0',
          projectId: project.id
        });

        await repo.createTask({
          title: 'Record three interview answers',
          microAction: 'Set camera tripod and pull up question prompt #1',
          estimatedMinutes: 45,
          priority: 'P1',
          projectId: project.id
        });

        await repo.createTask({
          title: 'Submit 3 targeted applications',
          microAction: 'Open company careers page and upload tailored CV',
          estimatedMinutes: 30,
          priority: 'P1'
        });

        await repo.createTask({
          title: '30 min operational systems reading',
          estimatedMinutes: 30,
          priority: 'P2'
        });
      }
    };

    seedInitialIfEmpty();
  }, []);

  const handleGoToNow = (taskId: string) => {
    setActiveNowTaskId(taskId);
    setActiveTab('now');
  };

  const handleOpenDayClose = () => {
    setActiveTab('review');
  };

  return (
    <SafeScreen>
      {/* Screen Router */}
      {activeTab === 'today' && (
        <TodayScreen
          onGoToNow={handleGoToNow}
          onOpenDayClose={handleOpenDayClose}
          onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        />
      )}

      {activeTab === 'now' && (
        <NowScreen
          initialTaskId={activeNowTaskId || activeTaskId}
          onBackToToday={() => setActiveTab('today')}
        />
      )}

      {activeTab === 'inbox' && (
        <InboxScreen />
      )}

      {activeTab === 'review' && (
        <ReviewScreen />
      )}

      {/* Floating / Universal Distraction Shield Modal */}
      <NoveltyCaptureModal
        isOpen={isNoveltyModalOpen}
        onClose={() => setIsNoveltyModalOpen(false)}
      />

      {/* Lightweight Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />

      {/* Mobile Safe-Area Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickCaptureClick={() => setIsNoveltyModalOpen(true)}
        hasActiveTaskRunning={isRunning}
      />
    </SafeScreen>
  );
};

export default App;

