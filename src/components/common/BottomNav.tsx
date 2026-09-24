import React from 'react';
import { Calendar, Play, Inbox, BarChart2, Plus } from 'lucide-react';

export type NavTab = 'today' | 'now' | 'inbox' | 'review';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickCaptureClick: () => void;
  hasActiveTaskRunning?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onQuickCaptureClick,
  hasActiveTaskRunning = false
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-console-surface/95 backdrop-blur-md border-t border-console-border pb-safe">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        {/* Today Tab */}
        <button
          type="button"
          onClick={() => onTabChange('today')}
          className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
            activeTab === 'today' ? 'text-console-accent font-semibold' : 'text-console-muted hover:text-console-text'
          }`}
          aria-label="Today"
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[11px] uppercase tracking-wider font-mono">Today</span>
        </button>

        {/* Now Tab */}
        <button
          type="button"
          onClick={() => onTabChange('now')}
          className={`flex-1 flex flex-col items-center justify-center py-2 relative transition-colors ${
            activeTab === 'now' ? 'text-console-accent font-semibold' : 'text-console-muted hover:text-console-text'
          }`}
          aria-label="Now"
        >
          <div className="relative">
            <Play className={`w-5 h-5 mb-1 ${hasActiveTaskRunning ? 'fill-emerald-400 text-emerald-400 animate-pulse' : ''}`} />
            {hasActiveTaskRunning && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[11px] uppercase tracking-wider font-mono">Now</span>
        </button>

        {/* Quick Capture Floating Action */}
        <div className="flex-shrink-0 px-2">
          <button
            type="button"
            onClick={onQuickCaptureClick}
            className="w-11 h-11 rounded-full bg-console-accent text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
            aria-label="Quick Park Idea"
            title="Park an idea (<3s)"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Inbox Tab */}
        <button
          type="button"
          onClick={() => onTabChange('inbox')}
          className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
            activeTab === 'inbox' ? 'text-console-accent font-semibold' : 'text-console-muted hover:text-console-text'
          }`}
          aria-label="Inbox"
        >
          <Inbox className="w-5 h-5 mb-1" />
          <span className="text-[11px] uppercase tracking-wider font-mono">Inbox</span>
        </button>

        {/* Review Tab */}
        <button
          type="button"
          onClick={() => onTabChange('review')}
          className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
            activeTab === 'review' ? 'text-console-accent font-semibold' : 'text-console-muted hover:text-console-text'
          }`}
          aria-label="Review"
        >
          <BarChart2 className="w-5 h-5 mb-1" />
          <span className="text-[11px] uppercase tracking-wider font-mono">Review</span>
        </button>
      </div>
    </nav>
  );
};

