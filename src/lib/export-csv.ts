import type { Reporte } from '@/types/database.types';
import { formatReporteNumero, formatFechaHoraLima } from './utils';

export function exportReportesToCSV(reportes: Reporte[], filename = 'reportes_maintai.csv') {
  const headers = [
    'Numero',
    'Fecha Creacion',
    'Tecnico',
    'Equipo',
    'Codigo Equipo',
    'Area',
    'Tipo Mantenimiento',
    'Falla',
    'Causa Probable',
    'Actividades',
    'Repuestos',
    'Prioridad',
    'Numero OT',
    'Fecha Intervencion',
    'Duracion (min)',
    'Estado',
    'Confianza IA',
    'Campos Faltantes',
    'Observaciones',
    'Origen',
    'Comentario Supervisor',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = reportes.map((r) => [
    escapeCSV(formatReporteNumero(r.numero)),
    escapeCSV(formatFechaHoraLima(r.created_at)),
    escapeCSV(r.tecnico_nombre || ''),
    escapeCSV(r.equipo || ''),
    escapeCSV(r.codigo_equipo || ''),
    escapeCSV(r.area || ''),
    escapeCSV(r.tipo_mantenimiento || ''),
    escapeCSV(r.falla || ''),
    escapeCSV(r.causa_probable || ''),
    escapeCSV((r.actividades || []).join('; ')),
    escapeCSV(
      (r.repuestos || [])
        .map((rep) => `${rep.nombre}${rep.cantidad ? ` x${rep.cantidad}` : ''}`)
        .join('; ')
    ),
    escapeCSV(r.prioridad || ''),
    escapeCSV(r.numero_ot || ''),
    escapeCSV(r.fecha_intervencion || ''),
    escapeCSV(r.duracion_minutos ?? ''),
    escapeCSV(r.estado),
    escapeCSV(r.confianza ? `${Math.round(r.confianza * 100)}%` : ''),
    escapeCSV((r.campos_faltantes || []).join(', ')),
    escapeCSV(r.observaciones || ''),
    escapeCSV(r.origen || ''),
    escapeCSV(r.comentario_supervisor || ''),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel compatibility
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
