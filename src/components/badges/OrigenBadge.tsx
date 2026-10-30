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
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#6f42c1] text-white shadow-2xs',
          className
        )}
        title={duracionSeg ? `Audio de ${duracionSeg} segundos` : 'Audio'}
      >
        <Mic className="w-3 h-3" />
        <span>Audio{duracionSeg ? ` (${formatSegundos(duracionSeg)})` : ''}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#17a2b8] text-white shadow-2xs',
        className
      )}
      title="Mensaje de texto"
    >
      <MessageSquareText className="w-3 h-3" />
      <span>Texto</span>
    </span>
  );
}
