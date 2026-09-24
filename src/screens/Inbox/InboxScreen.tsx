import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, ArrowUpRight, Trash2, Lightbulb } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';
import { NoveltyCapture } from '../../core/types/domain';

export const InboxScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const novelties = useLiveQuery(() => repo.getUnprocessedNovelties()) || [];

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await repo.captureNovelty(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromote = async (item: NoveltyCapture) => {
    await repo.promoteNoveltyToTask(item.id, item.content);
  };

  const handleDismiss = async (item: NoveltyCapture) => {
    await repo.dismissNovelty(item.id);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 pt-2">
      {/* Header */}
      <div className="border-b border-console-border pb-3">
        <div className="text-[11px] font-mono tracking-widest text-console-muted uppercase">
          Distraction Shield
        </div>
        <h1 className="text-lg font-bold text-console-text">
          Idea Inbox & Parking Lot
        </h1>
        <p className="text-xs text-console-muted mt-1">
          Capture immediate novelty. Protect today's locked commitments.
        </p>
      </div>

      {/* 1-Field Fast Capture */}
      <form onSubmit={handleCapture} className="flex space-x-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Capture idea, thought, or rabbit hole..."
          className="flex-1 bg-console-surface border border-console-border rounded-xl px-3.5 py-3 text-sm text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent"
        />
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 bg-console-accent hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors active:scale-95"
          aria-label="Capture"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      {/* Captured Novelties List */}
      <div className="flex-1 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-console-muted pt-2">
          <span>Parked Items ({novelties.length})</span>
          <span>Execute later</span>
        </div>

        {novelties.length === 0 ? (
          <div className="text-center py-12 bg-console-card/30 border border-dashed border-console-border rounded-xl p-6">
            <Lightbulb className="w-8 h-8 text-console-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-console-muted">
              Inbox is empty. When a shiny alternative pops into your mind, park it here in seconds.
            </p>
          </div>
        ) : (
          novelties.map(item => (
            <div
              key={item.id}
              className="bg-console-surface border border-console-border rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-sm"
            >
              <div className="flex-1">
                <p className="text-xs text-console-text font-medium leading-relaxed">
                  {item.content}
                </p>
                <span className="text-[10px] font-mono text-console-muted mt-1 block">
                  {new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Triage Actions */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handlePromote(item)}
                  title="Promote to backlog task"
                  className="p-1.5 rounded-lg bg-console-card hover:bg-console-card/80 border border-console-border text-console-accent text-xs font-mono flex items-center space-x-1 active:scale-95 transition-transform"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">To Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(item)}
                  title="Dismiss item"
                  className="p-1.5 rounded-lg bg-console-card hover:bg-red-950/40 border border-console-border hover:border-red-800 text-console-muted hover:text-red-400 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

