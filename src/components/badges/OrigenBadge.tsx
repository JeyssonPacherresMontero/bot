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
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20',
          className
        )}
        title={duracionSeg ? `Audio de ${duracionSeg} segundos` : 'Audio'}
      >
        <Mic className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
        <span>Audio{duracionSeg ? ` · ${formatSegundos(duracionSeg)}` : ''}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
        className
      )}
      title="Mensaje de texto"
    >
      <MessageSquareText className="w-3 h-3 text-slate-600 dark:text-slate-400" />
      <span>Texto</span>
    </span>
  );
}
