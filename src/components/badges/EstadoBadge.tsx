import React from 'react';
import type { EstadoReporte } from '@/types/database.types';
import { Clock, CheckCircle2, AlertCircle, CheckCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstadoBadgeProps {
  estado: EstadoReporte | string;
  isDemorado?: boolean;
  className?: string;
}

export function EstadoBadge({ estado, isDemorado = false, className }: EstadoBadgeProps) {
  switch (estado) {
    case 'pendiente':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
            isDemorado && 'ring-1 ring-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
            className
          )}
          title={isDemorado ? 'Pendiente hace más de 24h sin revisión' : 'Pendiente de revisión'}
        >
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Pendiente</span>
          {isDemorado && <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-bold ml-0.5">+24h</span>}
        </span>
      );
    case 'corregido':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20',
            isDemorado && 'ring-1 ring-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
            className
          )}
          title={isDemorado ? 'Corregido hace más de 24h sin revisión' : 'Corregido por técnico'}
        >
          <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          <span>Corregido</span>
          {isDemorado && <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-bold ml-0.5">+24h</span>}
        </span>
      );
    case 'confirmado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
            className
          )}
          title="Confirmado por técnico"
        >
          <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Confirmado</span>
        </span>
      );
    case 'revisado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
            className
          )}
          title="Aprobado y cerrado por supervisor"
        >
          <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Revisado</span>
        </span>
      );
    case 'rechazado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
            className
          )}
          title="Rechazado"
        >
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Rechazado</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
            className
          )}
        >
          <span>{estado}</span>
        </span>
      );
  }
}
