'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  Clock,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { cn, formatReporteNumero, formatFechaHoraLima, formatFechaLima } from '@/lib/utils';
import { exportSingleReporteToExcel } from '@/lib/export-excel';
import type { Reporte, Perfil } from '@/types/database.types';

interface InformeEjecutivoModalProps {
  reporte: Reporte;
  supervisorRevisor?: Perfil | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InformeEjecutivoModal({
  reporte,
  supervisorRevisor,
  isOpen,
  onClose,
}: InformeEjecutivoModalProps) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines: string[] = [];
    lines.push(`=======================================================`);
    lines.push(`INFORME TÉCNICO DE MANTENIMIENTO · IT-${formatReporteNumero(reporte.numero)}`);
    lines.push(`CENTRAL TÉRMICA & COGENERACIÓN INDUSTRIAL`);
    lines.push(`=======================================================`);
    lines.push(`FECHA: ${formatFechaLima(reporte.fecha_inicio || reporte.fecha_intervencion || reporte.created_at)}`);
    lines.push(`ESTADO OFICIAL: ${reporte.estado.toUpperCase()}`);
    lines.push(`ORDEN DE TRABAJO (OT): ${reporte.numero_ot || 'Sin OT'}`);
    lines.push(`UNIDAD: ${reporte.unidad || '—'} | PUESTO: ${reporte.puesto_trabajo || '—'} | OW/OS: ${reporte.ow_os || '—'}`);
    lines.push(`TÍTULO: ${reporte.titulo_trabajo || '—'}`);
    lines.push(`EQUIPO: ${reporte.equipo || '—'} [${reporte.codigo_equipo || 'S/C'}]`);
    lines.push(`ÁREA: ${reporte.area || '—'}`);
    lines.push(`RÉGIMEN: Notif. ${reporte.tipo_notificacion || '—'} | Tipo: ${reporte.tipo_mantenimiento || '—'} | Prioridad: ${reporte.prioridad || '—'}`);
    lines.push(`HORARIO: ${reporte.fecha_inicio || '—'} ${reporte.hora_inicio || ''} a ${reporte.fecha_fin || '—'} ${reporte.hora_fin || ''}`);
    const countEjecutantes = Math.max(1, Array.isArray(reporte.responsables_ejecutantes) ? reporte.responsables_ejecutantes.filter((e) => e.nombre?.trim()).length || 1 : 1);
    const hhTxt = reporte.total_horas_hombre !== null && reporte.total_horas_hombre !== undefined
      ? `${reporte.total_horas_hombre} H-H`
      : (reporte.duracion_minutos && reporte.duracion_minutos > 0
          ? `${Number(((reporte.duracion_minutos / 60) * countEjecutantes).toFixed(2))} H-H`
          : '—');
    lines.push(`DURACIÓN: ${reporte.duracion_minutos ? `${reporte.duracion_minutos} min` : 'No especificada'} | H-H TOTAL: ${hhTxt}`);
    lines.push(`-------------------------------------------------------`);
    lines.push(`PERSONAL Y RESPONSABLES:`);
    lines.push(`- Supervisor Operaciones: ${reporte.supervisor_operaciones || '—'}`);
    lines.push(`- Resp. Ejecución: ${reporte.responsable_ejecucion || '—'}`);
    lines.push(`- Resp. Trabajo: ${reporte.responsable_trabajo_nombre || reporte.tecnico_nombre || '—'} (Telf: ${reporte.responsable_trabajo_telefono || '—'})`);
    lines.push(`-------------------------------------------------------`);
    lines.push(`DIAGNÓSTICO TÉCNICO:`);
    lines.push(`- Falla reportada: ${reporte.falla || '—'}`);
    lines.push(`- Causa probable: ${reporte.causa_probable || '—'}`);
    lines.push(`-------------------------------------------------------`);
    lines.push(`ACTIVIDADES EJECUTADAS Y MEDICIONES:`);
    if (reporte.actividades && reporte.actividades.length > 0) {
      reporte.actividades.forEach((act, idx) => lines.push(`  ${idx + 1}. ${act}`));
    } else {
      lines.push(`  — Ninguna registrada`);
    }
    lines.push(`-------------------------------------------------------`);
    lines.push(`HERRAMIENTAS UTILIZADAS:`);
    if (reporte.herramientas && reporte.herramientas.length > 0) {
      reporte.herramientas.forEach((h) =>
        lines.push(`  • ${h.nombre}${h.modelo ? ` [Mod: ${h.modelo}]` : ''} (Procedencia: ${h.procedencia || 'GMO'})`)
      );
    } else {
      lines.push(`  — Sin herramientas registradas`);
    }
    lines.push(`-------------------------------------------------------`);
    lines.push(`MATERIALES CONSUMIBLES:`);
    if (reporte.materiales_consumibles && reporte.materiales_consumibles.length > 0) {
      reporte.materiales_consumibles.forEach((m) =>
        lines.push(`  • ${m.nombre}${m.cantidad !== null && m.cantidad !== undefined ? ` (Cant: ${m.cantidad} ${m.unidad || 'un.'})` : ''}${m.codigo ? ` [Cód: ${m.codigo}]` : ''} (Procedencia: ${m.procedencia || 'GMO'})`)
      );
    } else {
      lines.push(`  — Sin materiales consumibles`);
    }
    lines.push(`-------------------------------------------------------`);
    lines.push(`REPUESTOS CAPITALIZABLES:`);
    if (reporte.repuestos && reporte.repuestos.length > 0) {
      reporte.repuestos.forEach((rep) =>
        lines.push(`  • ${rep.nombre}${rep.cantidad ? ` (Cant: ${rep.cantidad})` : ''}${rep.codigo ? ` [Cód: ${rep.codigo}]` : ''}`)
      );
    } else {
      lines.push(`  — Sin repuestos utilizados`);
    }
    lines.push(`-------------------------------------------------------`);
    lines.push(`OBSERVACIONES & SUGERENCIAS:`);
    lines.push(`${reporte.observaciones || 'Sin observaciones'}`);
    lines.push(`¿REQUIERE GENERAR AVISO SAP/GMAO?: ${reporte.requiere_aviso ? 'SÍ' : 'NO'}`);
    lines.push(`=======================================================`);
    lines.push(`ID SISTEMA: ${reporte.id}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPrioridadBadgeClass = (prio: string | null) => {
    switch (prio) {
      case 'critica':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      case 'alta':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'media':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'baja':
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getEstadoStamp = () => {
    if (reporte.estado === 'revisado') {
      return (
        <div className="border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase inline-flex items-center gap-1.5 bg-emerald-50/50 dark:bg-emerald-950/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Validado y Aprobado</span>
        </div>
      );
    }
    if (reporte.estado === 'rechazado') {
      return (
        <div className="border-2 border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase inline-flex items-center gap-1.5 bg-rose-50/50 dark:bg-rose-950/30">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Observado / Rechazado</span>
        </div>
      );
    }
    return (
      <div className="border-2 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase inline-flex items-center gap-1.5 bg-blue-50/50 dark:bg-blue-950/30">
        <Clock className="w-3.5 h-3.5" />
        <span>Borrador Oficial en Revisión</span>
      </div>
    );
  };

  const ejecutantes = reporte.responsables_ejecutantes || [];
  const fechaDoc = reporte.fecha_inicio || reporte.fecha_intervencion || reporte.created_at;

  const countEjecutantesReporte = Math.max(
    1,
    (Array.isArray(reporte.responsables_ejecutantes)
      ? reporte.responsables_ejecutantes.filter((e) => e.nombre?.trim()).length
      : 0) || (reporte.tecnico_nombre ? 1 : 1)
  );

  const hhCalculadoDisplay =
    reporte.total_horas_hombre !== null && reporte.total_horas_hombre !== undefined
      ? `${reporte.total_horas_hombre} H-H`
      : reporte.duracion_minutos && reporte.duracion_minutos > 0
      ? `${Number(((reporte.duracion_minutos / 60) * countEjecutantesReporte).toFixed(2))} H-H`
      : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Vista de Informe Corporativo Ejecutivo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formato empresarial para supervisión, auditoría y presentación gerencial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              title="Copiar texto resumen"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
            <button
              onClick={() => exportSingleReporteToExcel(reporte, supervisorRevisor)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              title="Descargar Ficha Técnica en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Report Body */}
        <div
          ref={printRef}
          className="print-container overflow-y-auto p-6 sm:p-10 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
        >
          {/* Header Corporativo Oficial */}
          <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm tracking-wider">
                    MA
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white uppercase">
                      Central Térmica &amp; Cogeneración Industrial
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      División de Mantenimiento de Planta &amp; Gestión de Activos Críticos
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    Informe Técnico de Intervención Operativa
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end justify-between gap-2">
                {getEstadoStamp()}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 sm:text-right">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">N° Informe: </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      IT-{formatReporteNumero(reporte.numero)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Emisión: </span>
                    <span>{formatFechaHoraLima(reporte.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">ID Digital: </span>
                    <span className="font-mono text-[10px] text-slate-400">{reporte.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Resumen Ejecutivo de Datos Clave (Ficha Técnica) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Identificación del Activo y Datos de la Orden (Formato Físico)</span>
            </div>
            {reporte.titulo_trabajo && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-300 uppercase text-[10px] tracking-wider block mb-0.5">
                  1. Título del Trabajo
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
                  {reporte.titulo_trabajo}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Equipo Principal
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {reporte.equipo || 'No especificado'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Código de Tag
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                  {reporte.codigo_equipo ? `[${reporte.codigo_equipo}]` : 'Sin código'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Área / Ubicación
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {reporte.area || 'Planta General'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Orden de Trabajo (OT)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {reporte.numero_ot ? `OT #${reporte.numero_ot}` : 'Sin OT registrada'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Unidad
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100 uppercase">
                  {reporte.unidad || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Puesto de Trabajo
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100 uppercase">
                  {reporte.puesto_trabajo || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  OW / OS
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {reporte.ow_os || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Tipo Notificación
                </span>
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {reporte.tipo_notificacion ? `Notif. ${reporte.tipo_notificacion}` : 'No definida'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Tipo Mantenimiento
                </span>
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                  {reporte.tipo_mantenimiento || 'No definido'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Prioridad Operativa
                </span>
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase border',
                    getPrioridadBadgeClass(reporte.prioridad)
                  )}
                >
                  {reporte.prioridad || 'Normal'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Duración Total
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {reporte.duracion_minutos
                    ? `${reporte.duracion_minutos} min (${(reporte.duracion_minutos / 60).toFixed(1)} h)`
                    : 'No especificada'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Total Horas-Hombre
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  {hhCalculadoDisplay}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Horarios y Personal Técnico */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Horarios */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Cronograma de Intervención</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Fecha de Referencia:</span>
                  <span className="font-semibold">{formatFechaLima(fechaDoc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Inicio de Trabajos:</span>
                  <span className="font-mono font-medium">
                    {reporte.fecha_inicio || '—'} {reporte.hora_inicio ? `(${reporte.hora_inicio})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Término de Trabajos:</span>
                  <span className="font-mono font-medium">
                    {reporte.fecha_fin || '—'} {reporte.hora_fin ? `(${reporte.hora_fin})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Técnico */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Personal Ejecutante &amp; Supervisión</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Técnico Titular:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {reporte.tecnico_nombre || 'No registrado'}
                  </span>
                </div>
                {reporte.supervisor_operaciones && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Supervisor GM Operaciones:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {reporte.supervisor_operaciones}
                    </span>
                  </div>
                )}
                {reporte.responsable_ejecucion && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Responsable de Ejecución:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {reporte.responsable_ejecucion}
                    </span>
                  </div>
                )}
                {(reporte.responsable_trabajo_nombre || reporte.responsable_trabajo_telefono) && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Responsable del Trabajo:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {reporte.responsable_trabajo_nombre || '—'} {reporte.responsable_trabajo_telefono ? `(Cel: ${reporte.responsable_trabajo_telefono})` : ''}
                    </span>
                  </div>
                )}
                {ejecutantes.length > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">
                      Cuadrilla de Campo ({ejecutantes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ejecutantes.map((ej, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400">[{ej.rol}]</span>
                          <span>{ej.nombre}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {supervisorRevisor && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Supervisor Revisor:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {supervisorRevisor.nombre}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 3. Diagnóstico Técnico: Falla & Causa Raíz */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Diagnóstico Técnico &amp; Evaluación de Falla</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide text-[11px]">
                  Síntoma / Anomalía Observada
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {reporte.falla || 'No se detalló anomalía específica.'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1">
                <span className="font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wide text-[11px]">
                  Causa Raíz Probable / Hipótesis
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {reporte.causa_probable || 'Causa no determinada en esta intervención.'}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Actividades Ejecutadas */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>5. Detalle del Trabajo Ejecutado y Mediciones</span>
            </div>
            {reporte.actividades && reporte.actividades.length > 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4">
                <ol className="space-y-2 text-xs">
                  {reporte.actividades.map((act, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {act}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl">
                No se registraron actividades específicas en el relato del reporte.
              </p>
            )}
          </section>

          {/* 5. Herramientas Usadas */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>6. Herramientas Utilizadas (GMO / Externa)</span>
            </div>
            {reporte.herramientas && reporte.herramientas.length > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Herramienta / Instrumento</th>
                      <th className="py-2.5 px-4 w-40 text-center">Modelo / Código</th>
                      <th className="py-2.5 px-4 w-32 text-center">Procedencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reporte.herramientas.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-4 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {h.nombre}
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          {h.modelo || '—'}
                        </td>
                        <td className="py-2 px-4 text-center font-bold">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px]',
                              h.procedencia === 'EXT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            )}
                          >
                            {h.procedencia || 'GMO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                No se registraron herramientas específicas en el reporte.
              </p>
            )}
          </section>

          {/* 6. Materiales Consumibles */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>7. Materiales Consumibles Utilizados (GMO / Externa)</span>
            </div>
            {reporte.materiales_consumibles && reporte.materiales_consumibles.length > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Descripción del Material Consumible</th>
                      <th className="py-2.5 px-4 w-28 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 w-36 text-center">Código / Espec.</th>
                      <th className="py-2.5 px-4 w-28 text-center">Procedencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reporte.materiales_consumibles.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-4 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {m.nombre}
                        </td>
                        <td className="py-2 px-4 text-center font-bold">
                          {m.cantidad !== null && m.cantidad !== undefined
                            ? `${m.cantidad} ${m.unidad || 'un.'}`
                            : 'No especificada'}
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          {m.codigo || '—'}
                        </td>
                        <td className="py-2 px-4 text-center font-bold">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px]',
                              m.procedencia === 'EXT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            )}
                          >
                            {m.procedencia || 'GMO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                No se registraron materiales consumibles en la intervención.
              </p>
            )}
          </section>

          {/* 7. Manifiesto de Repuestos Capitalizables */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>8. Repuestos Capitalizables (Almacén Central)</span>
            </div>
            {reporte.repuestos && reporte.repuestos.length > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Descripción del Repuesto</th>
                      <th className="py-2.5 px-4 w-28 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 w-36 text-center">Código SAP / Almacén</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reporte.repuestos.map((rep, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-4 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {rep.nombre}
                        </td>
                        <td className="py-2 px-4 text-center font-bold">
                          {rep.cantidad !== null && rep.cantidad !== undefined ? `${rep.cantidad} un.` : '—'}
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          {rep.codigo || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                Intervención ejecutada sin requerimiento ni consumo de repuestos de almacén.
              </p>
            )}
          </section>

          {/* 8. Observaciones de Campo y Comentarios de Supervisión */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>9. Observaciones y Sugerencias / Aviso SAP</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[11px] block">
                  5. Observación y/o Sugerencias
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {reporte.observaciones || 'Sin observaciones registradas.'}
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    ¿Requiere generar aviso por observaciones encontradas?
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded font-bold text-[10px]',
                      reporte.requiere_aviso
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {reporte.requiere_aviso ? 'SÍ (REQUIERE AVISO)' : 'NO'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase text-[11px] block">
                  Comentario del Supervisor
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {reporte.comentario_supervisor || 'Pendiente de revisión o sin comentarios adicionales.'}
                </p>
              </div>
            </div>
          </section>

          {/* 7. Bloque de Firmas Corporativas (Firma y Validación de Ingeniería) */}
          <section className="pt-6 border-t border-slate-300 dark:border-slate-700 print-page-break">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-12">
                <div className="h-14 border-b border-slate-400 dark:border-slate-600 flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {reporte.tecnico_nombre ? `[Registro Digital: ${reporte.tecnico_nombre}]` : ''}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px]">
                    {reporte.tecnico_nombre || 'Técnico Responsable'}
                  </p>
                  <p className="text-[10px] text-slate-500">Especialista de Mantenimiento</p>
                  <p className="text-[10px] text-slate-400">Ejecutante en Planta</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="h-14 border-b border-slate-400 dark:border-slate-600 flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {supervisorRevisor?.nombre ? `[V°B°: ${supervisorRevisor.nombre}]` : ''}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px]">
                    {supervisorRevisor?.nombre || 'Supervisor de Guardia'}
                  </p>
                  <p className="text-[10px] text-slate-500">Supervisión de Mantenimiento</p>
                  <p className="text-[10px] text-slate-400">Revisión &amp; Validación Técnica</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="h-14 border-b border-slate-400 dark:border-slate-600 flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {reporte.estado === 'revisado' ? '[Conformidad de Planta]' : ''}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px]">
                    Jefatura de Operaciones
                  </p>
                  <p className="text-[10px] text-slate-500">Gestión de Confiabilidad</p>
                  <p className="text-[10px] text-slate-400">Aprobación Final</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex flex-wrap justify-between items-center">
              <span>MaintAI Enterprise — Plataforma Digital de Mantenimiento Predictivo y Correctivo</span>
              <span>Página 1 de 1 · Documento Oficial de Mantenimiento</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
