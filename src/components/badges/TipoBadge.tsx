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
    return <span className={cn('text-xs text-slate-400 dark:text-slate-500', className)}>—</span>;
  }

  switch (tipo.toLowerCase()) {
    case 'correctivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900',
            className
          )}
        >
          <ShieldAlert className="w-3 h-3 text-red-500" />
          <span>Correctivo</span>
        </span>
      );
    case 'preventivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-900',
            className
          )}
        >
          <Wrench className="w-3 h-3 text-sky-500" />
          <span>Preventivo</span>
        </span>
      );
    case 'predictivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900',
            className
          )}
        >
          <Activity className="w-3 h-3 text-purple-500" />
          <span>Predictivo</span>
        </span>
      );
    case 'inspeccion':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-900',
            className
          )}
        >
          <Search className="w-3 h-3 text-teal-500" />
          <span>Inspección</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            className
          )}
        >
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Otro</span>
        </span>
      );
  }
}
