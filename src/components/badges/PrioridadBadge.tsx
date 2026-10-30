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
      <span className={cn('inline-flex items-center text-xs text-slate-400 dark:text-slate-500', className)}>
        —
      </span>
    );
  }

  switch (prioridad.toLowerCase()) {
    case 'critica':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800',
            className
          )}
        >
          <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />
          <span>Crítica</span>
        </span>
      );
    case 'alta':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
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
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
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
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            className
          )}
        >
          <ArrowDown className="w-3 h-3 text-slate-500" />
          <span>Baja</span>
        </span>
      );
    default:
      return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', className)}>
          {prioridad}
        </span>
      );
  }
}
