import React from 'react';
import type { TipoMantenimiento } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { Wrench, ShieldAlert, Activity, Search, HelpCircle } from 'lucide-react';

interface TipoBadgeProps {
  tipo: TipoMantenimiento | string | null | undefined;
  className?: string;
}

export function TipoBadge({ tipo, className }: TipoBadgeProps) {
  if (!tipo) {
    return <span className={cn('text-xs text-[#adb5bd]', className)}>—</span>;
  }

  switch (tipo.toLowerCase()) {
    case 'correctivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#dc3545] text-white shadow-2xs',
            className
          )}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Correctivo</span>
        </span>
      );
    case 'preventivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#007bff] text-white shadow-2xs',
            className
          )}
        >
          <Wrench className="w-3 h-3" />
          <span>Preventivo</span>
        </span>
      );
    case 'predictivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#6f42c1] text-white shadow-2xs',
            className
          )}
        >
          <Activity className="w-3 h-3" />
          <span>Predictivo</span>
        </span>
      );
    case 'inspeccion':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#17a2b8] text-white shadow-2xs',
            className
          )}
        >
          <Search className="w-3 h-3" />
          <span>Inspección</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-medium bg-[#6c757d] text-white',
            className
          )}
        >
          <HelpCircle className="w-3 h-3" />
          <span>{tipo}</span>
        </span>
      );
  }
}
