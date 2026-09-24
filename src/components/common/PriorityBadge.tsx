import React from 'react';
import { PriorityLevel } from '../../core/types/domain';

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  switch (priority) {
    case 'P0':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono bg-red-950/80 text-red-400 border border-red-800/60">
          P0 CRITICAL
        </span>
      );
    case 'P1':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono bg-amber-950/80 text-amber-400 border border-amber-800/60">
          P1 IMPORTANT
        </span>
      );
    case 'P2':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono bg-slate-900 text-slate-400 border border-slate-700/60">
          P2 OPTIONAL
        </span>
      );
  }
};

