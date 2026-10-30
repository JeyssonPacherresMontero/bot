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
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#ffc107] text-[#1f2d3d] shadow-2xs',
            isDemorado && 'ring-2 ring-[#dc3545] animate-pulse bg-[#dc3545] text-white',
            className
          )}
          title={isDemorado ? 'Pendiente hace más de 24h sin revisión' : 'Pendiente de revisión'}
        >
          <Clock className="w-3 h-3" />
          <span>Pendiente</span>
          {isDemorado && <span className="bg-black/30 text-white text-[10px] px-1 rounded ml-0.5 font-black">+24h</span>}
        </span>
      );
    case 'corregido':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#fd7e14] text-white shadow-2xs',
            isDemorado && 'ring-2 ring-[#dc3545] animate-pulse bg-[#dc3545] text-white',
            className
          )}
          title={isDemorado ? 'Corregido hace más de 24h sin revisión' : 'Corregido por técnico'}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Corregido</span>
          {isDemorado && <span className="bg-black/30 text-white text-[10px] px-1 rounded ml-0.5 font-black">+24h</span>}
        </span>
      );
    case 'confirmado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#007bff] text-white shadow-2xs',
            className
          )}
          title="Confirmado por técnico / listo para cierre"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Confirmado</span>
        </span>
      );
    case 'revisado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#28a745] text-white shadow-2xs',
            className
          )}
          title="Aprobado y cerrado por supervisor"
        >
          <CheckCheck className="w-3 h-3" />
          <span>Revisado</span>
        </span>
      );
    case 'rechazado':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#dc3545] text-white shadow-2xs',
            className
          )}
          title="Rechazado"
        >
          <XCircle className="w-3 h-3" />
          <span>Rechazado</span>
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold bg-[#6c757d] text-white shadow-2xs',
            className
          )}
        >
          <span>{estado}</span>
        </span>
      );
  }
}
