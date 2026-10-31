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
    return <span className={cn('text-xs text-slate-400', className)}>—</span>;
  }

  switch (tipo.toLowerCase()) {
    case 'correctivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
            className
          )}
        >
          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Correctivo</span>
        </span>
      );
    case 'preventivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
            className
          )}
        >
          <Wrench className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Preventivo</span>
        </span>
      );
    case 'predictivo':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20',
            className
          )}
        >
          <Activity className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span>Predictivo</span>
        </span>
      );
    case 'inspeccion':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20',
            className
          )}
        >
          <Search className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>Inspección</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            className
          )}
        >
          <HelpCircle className="w-3 h-3 text-slate-500" />
          <span>{tipo}</span>
        </span>
      );
  }
}
