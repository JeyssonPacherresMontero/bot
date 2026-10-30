import React from 'react';
import type { OrigenReporte } from '@/types/database.types';
import { Mic, MessageSquareText } from 'lucide-react';
import { cn, formatSegundos } from '@/lib/utils';

interface OrigenBadgeProps {
  origen: OrigenReporte | string | null | undefined;
  duracionSeg?: number | null;
  className?: string;
}

export function OrigenBadge({ origen, duracionSeg, className }: OrigenBadgeProps) {
  if (origen === 'audio') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
          className
        )}
        title={duracionSeg ? `Audio de ${duracionSeg} segundos` : 'Audio'}
      >
        <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Audio{duracionSeg ? ` (${formatSegundos(duracionSeg)})` : ''}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
        className
      )}
      title="Mensaje de texto"
    >
      <MessageSquareText className="w-3.5 h-3.5 text-slate-500" />
      <span>Texto</span>
    </span>
  );
}
