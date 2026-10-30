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
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
            isDemorado && 'ring-2 ring-red-500 animate-pulse bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300',
            className
          )}
          title={isDemorado ? 'Pendiente hace más de 24h sin revisión' : 'Pendiente de revisión'}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pendiente</span>
          {isDemorado && <span className="text-[10px] bg-red-600 text-white px-1 rounded font-bold ml-1">+24h</span>}
        </span>
      );
    case 'corregido':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800',
            isDemorado && 'ring-2 ring-red-500 animate-pulse bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300',
            className
          )}
          title={isDemorado ? 'Corregido hace más de 24h sin revisión' : 'Corregido por técnico'}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Corregido</span>
          {isDemorado && <span className="text-[10px] bg-red-600 text-white px-1 rounded font-bold ml-1">+24h</span>}
        </span>
      );
    case 'confirmado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirmado</span>
        </span>
      );
    case 'revisado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
            className
          )}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Revisado</span>
        </span>
      );
    case 'rechazado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
            className
          )}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rechazado</span>
        </span>
      );
    default:
      return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', className)}>
          {estado}
        </span>
      );
  }
}
