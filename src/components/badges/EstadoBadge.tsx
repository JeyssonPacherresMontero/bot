import React from 'react';
import type { EstadoReporte } from '@/types/database.types';
import { Clock, CheckCheck, XCircle, FileEdit, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstadoBadgeProps {
  estado: EstadoReporte | string;
  isDemorado?: boolean;
  className?: string;
}

export function EstadoBadge({ estado, isDemorado = false, className }: EstadoBadgeProps) {
  switch (estado) {
    case 'confirmado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
            isDemorado && 'ring-1 ring-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse',
            className
          )}
          title={isDemorado ? 'Confirmado hace más de 24h esperando revisión de supervisor' : 'Confirmado por técnico · Esperando revisión'}
        >
          <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Confirmado (Por revisar)</span>
          {isDemorado && <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-bold ml-0.5">+24h</span>}
        </span>
      );
    case 'revisado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
            className
          )}
          title="Validado y aprobado por supervisor"
        >
          <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Revisado</span>
        </span>
      );
    case 'rechazado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
            className
          )}
          title="Rechazado por supervisión con observación enviada a Telegram"
        >
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Rechazado</span>
        </span>
      );
    case 'pendiente':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
            isDemorado && 'ring-1 ring-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
            className
          )}
          title={isDemorado ? 'Histórico pendiente hace más de 24h' : 'Registro histórico en estado pendiente'}
        >
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Pendiente (Histórico)</span>
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
          title={isDemorado ? 'Histórico corregido hace más de 24h' : 'Registro histórico corregido por técnico'}
        >
          <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          <span>Corregido (Histórico)</span>
          {isDemorado && <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-bold ml-0.5">+24h</span>}
        </span>
      );
    case 'borrador':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
            className
          )}
          title="Borrador en Telegram previo a confirmación"
        >
          <FileEdit className="w-3 h-3 text-slate-500" />
          <span>Borrador (Telegram)</span>
        </span>
      );
    case 'editando':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20',
            className
          )}
          title="Técnico corrigiendo o editando datos en Telegram"
        >
          <FileEdit className="w-3 h-3 text-indigo-500" />
          <span>En edición (Telegram)</span>
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
          <span>{estado || 'Sin estado'}</span>
        </span>
      );
  }
}
