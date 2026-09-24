import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { repo } from '../../core/storage/localRepo';

interface NoveltyCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured?: (content: string) => void;
}

export const NoveltyCaptureModal: React.FC<NoveltyCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptured
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await repo.captureNovelty(content);
      onCaptured?.(content);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-console-surface border border-console-border rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-console-accent">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold">
              Distraction Shield • Novelty Capture
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-console-muted hover:text-console-text p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-console-muted mb-4">
          Park the shiny thought immediately. Keep your current execution intact.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What shiny idea just popped up?..."
            className="w-full bg-console-card border border-console-border rounded-lg px-3.5 py-3 text-sm text-console-text placeholder-console-muted/60 focus:outline-none focus:border-console-accent focus:ring-1 focus:ring-console-accent"
          />

          <div className="flex items-center justify-end space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase text-console-muted hover:text-console-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-5 py-2.5 bg-console-accent hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-xs font-mono uppercase font-semibold transition-colors"
            >
              Park Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

