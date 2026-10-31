import React from 'react';
import type { PrioridadReporte } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { Flame, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface PrioridadBadgeProps {
  prioridad: PrioridadReporte | string | null | undefined;
  className?: string;
}

export function PrioridadBadge({ prioridad, className }: PrioridadBadgeProps) {
  if (!prioridad) {
    return (
      <span className={cn('text-xs text-slate-400', className)}>
        —
      </span>
    );
  }

  switch (prioridad.toLowerCase()) {
    case 'critica':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
            className
          )}
        >
          <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Crítica</span>
        </span>
      );
    case 'alta':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
            className
          )}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Alta</span>
        </span>
      );
    case 'media':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
            className
          )}
        >
          <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Media</span>
        </span>
      );
    case 'baja':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
            className
          )}
        >
          <ArrowDown className="w-3 h-3 text-slate-600 dark:text-slate-400" />
          <span>Baja</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            className
          )}
        >
          {prioridad}
        </span>
      );
  }
}
