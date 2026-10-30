import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número de reporte a formato REP-0001
 */
export function formatReporteNumero(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'REP-0000';
  return `REP-${String(num).padStart(4, '0')}`;
}

/**
 * Formatea una fecha ISO o string en formato dd/mm/aaaa en zona horaria America/Lima
 */
export function formatFechaLima(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Formatea fecha y hora completa en zona horaria America/Lima (dd/mm/aaaa hh:mm)
 */
export function formatFechaHoraLima(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Determina si un reporte lleva más de 24 horas en estado pendiente o corregido sin ser revisado
 */
export function isReporteDemorado(created_at: string, estado: string): boolean {
  if (estado !== 'pendiente' && estado !== 'corregido') return false;
  try {
    const createdTime = new Date(created_at).getTime();
    const now = Date.now();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);
    return diffHours > 24;
  } catch {
    return false;
  }
}

/**
 * Formatea el porcentaje de confianza
 */
export function formatConfianza(conf: number | null | undefined): string {
  if (conf === null || conf === undefined) return '—';
  return `${Math.round(conf * 100)}%`;
}

/**
 * Formatea duración en minutos o segundos
 */
export function formatMinutos(min: number | null | undefined): string {
  if (min === null || min === undefined) return '—';
  return `${min} min`;
}

export function formatSegundos(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return '—';
  return `${sec} s`;
}
