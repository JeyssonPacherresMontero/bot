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
  if (!dateInput) return 'Sin fecha';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return 'Sin fecha';
  }
}

/**
 * Formatea fecha y hora completa en zona horaria America/Lima (dd/mm/aaaa hh:mm)
 */
export function formatFechaHoraLima(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Sin fecha';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return 'Sin fecha';
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
    return 'Sin fecha';
  }
}

/**
 * Determina si un reporte confirmado lleva más de 24 horas esperando revisión de supervisión
 * (También compatible con reportes históricos en estado 'pendiente' o 'corregido')
 */
export function isReporteDemorado(created_at: string | null | undefined, estado: string | null | undefined): boolean {
  if (!created_at || !estado) return false;
  // Estados que esperan atención o revisión de supervisión
  const estadosEnEspera = ['confirmado', 'pendiente', 'corregido'];
  if (!estadosEnEspera.includes(estado)) return false;

  try {
    const createdTime = new Date(created_at).getTime();
    if (isNaN(createdTime)) return false;
    const now = Date.now();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);
    return diffHours > 24;
  } catch {
    return false;
  }
}

/**
 * Formatea el porcentaje de confianza orientativo de la IA
 */
export function formatConfianza(conf: number | null | undefined): string {
  if (conf === null || conf === undefined || isNaN(Number(conf))) return 'No evaluado';
  return `${Math.round(Number(conf) * 100)}% (orientativo)`;
}

/**
 * Formatea duración en minutos. Nunca presenta 0 cuando falta el dato.
 */
export function formatMinutos(min: number | null | undefined): string {
  if (min === null || min === undefined || isNaN(Number(min))) return 'No informado';
  return `${min} min`;
}

/**
 * Formatea tiempo de procesamiento de IA en segundos
 */
export function formatSegundos(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || isNaN(Number(sec))) return 'No registrado';
  return `${sec} s`;
}

/**
 * Formatea unidades de repuestos. Si falta la cantidad, indica claramente 'No especificada'
 */
export function formatUnidadesRepuesto(cant: number | null | undefined): string {
  if (cant === null || cant === undefined || isNaN(Number(cant))) return 'No especificada';
  return `${cant} u.`;
}
