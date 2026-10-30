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
      <span className={cn('text-xs text-[#adb5bd]', className)}>
        —
      </span>
    );
  }

  switch (prioridad.toLowerCase()) {
    case 'critica':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-bold bg-[#dc3545] text-white shadow-2xs',
            className
          )}
        >
          <Flame className="w-3 h-3" />
          <span>Crítica</span>
        </span>
      );
    case 'alta':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-bold bg-[#fd7e14] text-white shadow-2xs',
            className
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Alta</span>
        </span>
      );
    case 'media':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#17a2b8] text-white shadow-2xs',
            className
          )}
        >
          <ArrowUp className="w-3 h-3" />
          <span>Media</span>
        </span>
      );
    case 'baja':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#6c757d] text-white shadow-2xs',
            className
          )}
        >
          <ArrowDown className="w-3 h-3" />
          <span>Baja</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-[0.25rem] text-xs font-medium bg-[#6c757d] text-white',
            className
          )}
        >
          {prioridad}
        </span>
      );
  }
}
