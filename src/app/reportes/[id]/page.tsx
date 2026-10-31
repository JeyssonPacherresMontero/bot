'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  formatReporteNumero,
  formatFechaHoraLima,
  formatConfianza,
  formatSegundos,
  isReporteDemorado,
} from '@/lib/utils';
import type {
  Reporte,
  TipoMantenimiento,
  PrioridadReporte,
  RepuestoItem,
} from '@/types/database.types';
import {
  ArrowLeft,
  Save,
  CheckCheck,
  XCircle,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash,
  Bot,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function ReporteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAdmin } = useAuth();
  const supabase = createClient();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [otrosReportesEquipo, setOtrosReportesEquipo] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRawIa, setShowRawIa] = useState(false);

  // Form states
  const [equipo, setEquipo] = useState('');
  const [codigoEquipo, setCodigoEquipo] = useState('');
  const [area, setArea] = useState('');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<TipoMantenimiento | ''>('');
  const [falla, setFalla] = useState('');
  const [causaProbable, setCausaProbable] = useState('');
  const [actividades, setActividades] = useState<string[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoItem[]>([]);
  const [prioridad, setPrioridad] = useState<PrioridadReporte | ''>('');
  const [numeroOt, setNumeroOt] = useState('');
  const [fechaIntervencion, setFechaIntervencion] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [comentarioSupervisor, setComentarioSupervisor] = useState('');

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Load Report Data
  const loadReporte = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error al cargar reporte:', error);
        setReporte(null);
      } else {
        const r = data as Reporte;
        setReporte(r);
        setEquipo(r.equipo || '');
        setCodigoEquipo(r.codigo_equipo || '');
        setArea(r.area || '');
        setTipoMantenimiento(r.tipo_mantenimiento || '');
        setFalla(r.falla || '');
        setCausaProbable(r.causa_probable || '');
        setActividades(Array.isArray(r.actividades) ? r.actividades : []);
        setRepuestos(Array.isArray(r.repuestos) ? (r.repuestos as RepuestoItem[]) : []);
        setPrioridad(r.prioridad || '');
        setNumeroOt(r.numero_ot || '');
        setFechaIntervencion(r.fecha_intervencion ? r.fecha_intervencion.slice(0, 10) : '');
        setDuracionMinutos(r.duracion_minutos ?? '');
        setObservaciones(r.observaciones || '');
        setComentarioSupervisor(r.comentario_supervisor || '');

        // Fetch other reports from the same equipment
        if (r.equipo || r.codigo_equipo) {
          const filterTerm = r.codigo_equipo || r.equipo;
          const { data: otros } = await supabase
            .from('reportes')
            .select('*')
            .or(`equipo.eq.${filterTerm},codigo_equipo.eq.${filterTerm}`)
            .neq('id', r.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (otros) {
            setOtrosReportesEquipo(otros as Reporte[]);
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  // Handlers for dynamic list: Actividades
  const handleAddActividad = () => {
    setActividades([...actividades, '']);
  };

  const handleUpdateActividad = (index: number, val: string) => {
    const updated = [...actividades];
    updated[index] = val;
    setActividades(updated);
  };

  const handleRemoveActividad = (index: number) => {
    setActividades(actividades.filter((_, i) => i !== index));
  };

  // Handlers for dynamic list: Repuestos
  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: 1, codigo: null }]);
  };

  const handleUpdateRepuesto = (
    index: number,
    field: keyof RepuestoItem,
    val: string | number | null
  ) => {
    const updated = [...repuestos];
    updated[index] = { ...updated[index], [field]: val };
    setRepuestos(updated);
  };

  const handleRemoveRepuesto = (index: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  // Save manual modifications
  const handleSaveChanges = async () => {
    if (!reporte) return;
    setSaving(true);
    try {
      const payload: Partial<Reporte> = {
        equipo: equipo.trim() || null,
        codigo_equipo: codigoEquipo.trim() || null,
        area: area.trim() || null,
        tipo_mantenimiento: (tipoMantenimiento as TipoMantenimiento) || null,
        falla: falla.trim() || null,
        causa_probable: causaProbable.trim() || null,
        actividades: actividades.filter((a) => a.trim() !== ''),
        repuestos: repuestos.filter((r) => r.nombre.trim() !== ''),
        prioridad: (prioridad as PrioridadReporte) || null,
        numero_ot: numeroOt.trim() || null,
        fecha_intervencion: fechaIntervencion ? `${fechaIntervencion}T00:00:00Z` : null,
        duracion_minutos: duracionMinutos === '' ? null : Number(duracionMinutos),
        observaciones: observaciones.trim() || null,
        comentario_supervisor: comentarioSupervisor.trim() || null,
      };

      const { error } = await supabase.from('reportes').update(payload).eq('id', reporte.id);

      if (error) {
        alert(`Error al guardar cambios: ${error.message}`);
      } else {
        alert('Cambios guardados con éxito.');
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Validate (Revisado)
  const handleValidate = async () => {
    if (!reporte) return;
    const confirmVal = confirm('¿Confirmas la validación de este reporte de mantenimiento?');
    if (!confirmVal) return;

    setActionLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'revisado',
          revisado_por: user?.id || null,
          revisado_en: nowIso,
          comentario_supervisor: comentarioSupervisor.trim() || null,
        })
        .eq('id', reporte.id);

      if (error) {
        alert(`Error al validar reporte: ${error.message}`);
      } else {
        alert('Reporte marcado como validado.');
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject (Rechazado)
  const handleConfirmReject = async () => {
    if (!reporte || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'rechazado',
          revisado_por: user?.id || null,
          revisado_en: nowIso,
          comentario_supervisor: rejectReason.trim(),
        })
        .eq('id', reporte.id);

      if (error) {
        alert(`Error al rechazar reporte: ${error.message}`);
      } else {
        setShowRejectModal(false);
        alert('Reporte rechazado. El aviso ha sido registrado.');
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reopen (Pendiente)
  const handleReopen = async () => {
    if (!reporte) return;
    const confirmReopen = confirm('¿Deseas reabrir este reporte y devolverlo a estado pendiente?');
    if (!confirmReopen) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'pendiente',
        })
        .eq('id', reporte.id);

      if (error) {
        alert(`Error al reabrir reporte: ${error.message}`);
      } else {
        alert('Reporte reabierto en estado pendiente.');
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete (Admin only)
  const handleDelete = async () => {
    if (!reporte || !isAdmin) return;
    const confirmDel = confirm(
      '¿Estás seguro de que deseas eliminar este reporte de forma permanente? Esta acción no se puede deshacer.'
    );
    if (!confirmDel) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from('reportes').delete().eq('id', reporte.id);

      if (error) {
        alert(`Error al eliminar reporte: ${error.message}`);
      } else {
        alert('Reporte eliminado.');
        router.push('/reportes');
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="p-12 text-center modern-card">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Reporte no encontrado
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          El reporte solicitado no existe o no cuentas con los permisos necesarios.
        </p>
        <Link href="/reportes" className="btn-modern-primary text-xs mt-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al listado</span>
        </Link>
      </div>
    );
  }

  const faltantes = reporte.campos_faltantes || [];
  const demorado = isReporteDemorado(reporte.created_at, reporte.estado);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/reportes" className="btn-modern-default text-xs">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver</span>
      </Link>

      <button
        onClick={handleSaveChanges}
        disabled={saving || actionLoading}
        className="btn-modern-primary text-xs"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span>Guardar cambios</span>
      </button>

      {reporte.estado !== 'revisado' && (
        <button
          onClick={handleValidate}
          disabled={actionLoading || saving}
          className="btn-modern-success text-xs"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Validar reporte</span>
        </button>
      )}

      {reporte.estado !== 'rechazado' && (
        <button
          onClick={() => {
            setRejectReason(reporte.comentario_supervisor || '');
            setShowRejectModal(true);
          }}
          disabled={actionLoading || saving}
          className="btn-modern-danger text-xs"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rechazar</span>
        </button>
      )}

      {(reporte.estado === 'revisado' || reporte.estado === 'rechazado') && (
        <button
          onClick={handleReopen}
          disabled={actionLoading || saving}
          className="btn-modern-warning text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reabrir</span>
        </button>
      )}

      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={actionLoading || saving}
          className="btn-modern-danger text-xs px-2"
          title="Eliminar reporte para administradores"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title={`Reporte #${formatReporteNumero(reporte.numero)}`}
        subtitle={`Registrado el ${formatFechaHoraLima(reporte.created_at)} por ${reporte.tecnico_nombre || 'Técnico desconocido'}`}
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Reportes', href: '/reportes' },
          { label: `#${formatReporteNumero(reporte.numero)}`, active: true },
        ]}
        actions={headerActions}
      />

      {/* Origin & Metadata Strip */}
      <div className="modern-card p-4 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">Estado:</span>
            <EstadoBadge estado={reporte.estado} isDemorado={demorado} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">Origen:</span>
            <OrigenBadge origen={reporte.origen} duracionSeg={reporte.audio_duracion_seg} />
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tiempo IA:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatSegundos(reporte.tiempo_procesamiento_ms ? Math.round(reporte.tiempo_procesamiento_ms / 1000) : null)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Confianza:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatConfianza(reporte.confianza)}
            </span>
          </div>
        </div>

        {reporte.revisado_en && (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Validado el {formatFechaHoraLima(reporte.revisado_en)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main 2 Columns: Transcriptions & Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section: Relato Original del Técnico */}
          <div className="modern-card">
            <div className="modern-card-header">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Relato Original del Técnico
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {reporte.origen === 'audio' ? 'Transcripción Whisper' : 'Texto directo Telegram'}
              </span>
            </div>

            <div className="modern-card-body space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                  Texto Transcrito:
                </p>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reporte.texto_original || 'Sin texto original registrado.'}
                </p>
              </div>

              {reporte.texto_correccion && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-800/60 text-xs">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] mb-1.5">
                    Corrección posterior enviada por el técnico:
                  </p>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                    {reporte.texto_correccion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Formulario editable de campos extraídos */}
          <div className="modern-card">
            <div className="modern-card-header">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Campos Estructurados de la Intervención
                </span>
              </div>
              {faltantes.length > 0 && (
                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pendientes: {faltantes.join(', ')}</span>
                </span>
              )}
            </div>

            <div className="modern-card-body space-y-4">
              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Equipo */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipo {faltantes.includes('equipo') && <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px] ml-1">Requerido</span>}
                  </label>
                  <input
                    type="text"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value)}
                    placeholder="Ej. Turbina de vapor TV-01"
                    className={`modern-input ${faltantes.includes('equipo') ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20' : ''}`}
                  />
                </div>

                {/* Codigo Equipo */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Código o Tag de Equipo
                  </label>
                  <input
                    type="text"
                    value={codigoEquipo}
                    onChange={(e) => setCodigoEquipo(e.target.value)}
                    placeholder="Ej. P-101A, TV-01, CALD-2"
                    className="modern-input font-mono"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Área de Planta
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Sala de Turbinas, Condensados"
                    className="modern-input"
                  />
                </div>

                {/* Tipo Mantenimiento */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Mantenimiento
                  </label>
                  <select
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value as TipoMantenimiento)}
                    className="modern-input"
                  >
                    <option value="">Seleccione tipo...</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="preventivo">Preventivo</option>
                    <option value="predictivo">Predictivo</option>
                    <option value="inspeccion">Inspección</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as PrioridadReporte)}
                    className="modern-input"
                  >
                    <option value="">Seleccione prioridad...</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                {/* Numero OT */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de Orden de Trabajo
                  </label>
                  <input
                    type="text"
                    value={numeroOt}
                    onChange={(e) => setNumeroOt(e.target.value)}
                    placeholder="Ej. OT-2026-442"
                    className="modern-input font-mono"
                  />
                </div>

                {/* Fecha Intervención */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha de Intervención
                  </label>
                  <input
                    type="date"
                    value={fechaIntervencion}
                    onChange={(e) => setFechaIntervencion(e.target.value)}
                    className="modern-input"
                  />
                </div>

                {/* Duración en minutos */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Duración Estimada en Minutos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={duracionMinutos}
                    onChange={(e) =>
                      setDuracionMinutos(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej. 60"
                    className="modern-input"
                  />
                </div>
              </div>

              {/* Falla (Full Width) */}
              <div className="text-xs">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Falla Observada {faltantes.includes('falla') && <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px] ml-1">Requerido</span>}
                </label>
                <textarea
                  rows={2}
                  value={falla}
                  onChange={(e) => setFalla(e.target.value)}
                  placeholder="Descripción de la anomalía o falla reportada..."
                  className={`modern-input ${faltantes.includes('falla') ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20' : ''}`}
                />
              </div>

              {/* Causa Probable */}
              <div className="text-xs">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Causa Probable Determinada
                </label>
                <textarea
                  rows={2}
                  value={causaProbable}
                  onChange={(e) => setCausaProbable(e.target.value)}
                  placeholder="Origen probable determinado tras la inspección..."
                  className="modern-input"
                />
              </div>

              {/* Actividades (Editable list) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Actividades Realizadas
                    </label>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      {actividades.length}
                    </span>
                    {faltantes.includes('actividades') && (
                      <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">Requerido</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddActividad}
                    className="btn-modern-primary text-xs py-1 px-2.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir actividad</span>
                  </button>
                </div>

                {actividades.length === 0 ? (
                  <p className="text-slate-400 italic py-1">No se han registrado actividades.</p>
                ) : (
                  <div className="space-y-2">
                    {actividades.map((act, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-xs w-4">{index + 1}.</span>
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => handleUpdateActividad(index, e.target.value)}
                          placeholder="Ej. Desmontaje y cambio de sello mecánico..."
                          className="modern-input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveActividad(index)}
                          className="btn-modern-danger py-1.5 px-2"
                          title="Eliminar"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Repuestos (Editable table) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Repuestos Empleados
                    </label>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      {repuestos.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRepuesto}
                    className="btn-modern-primary text-xs py-1 px-2.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir repuesto</span>
                  </button>
                </div>

                {repuestos.length === 0 ? (
                  <p className="text-slate-400 italic py-1">No se indicaron repuestos utilizados.</p>
                ) : (
                  <div className="space-y-2">
                    {repuestos.map((rep, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={rep.nombre}
                            onChange={(e) => handleUpdateRepuesto(index, 'nombre', e.target.value)}
                            placeholder="Nombre del repuesto..."
                            className="modern-input"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={rep.cantidad ?? ''}
                            onChange={(e) =>
                              handleUpdateRepuesto(
                                index,
                                'cantidad',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            placeholder="Cant."
                            className="modern-input"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={rep.codigo ?? ''}
                            onChange={(e) =>
                              handleUpdateRepuesto(
                                index,
                                'codigo',
                                e.target.value.trim() ? e.target.value : null
                              )
                            }
                            placeholder="Código o Tag"
                            className="modern-input font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRepuesto(index)}
                            className="btn-modern-danger py-1.5 px-2"
                            title="Eliminar"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Observaciones Generales
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales o recomendaciones para el próximo turno..."
                  className="modern-input"
                />
              </div>

              {/* Comentario Supervisor */}
              <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Comentario de Supervisión para el Técnico
                </label>
                <textarea
                  rows={2}
                  value={comentarioSupervisor}
                  onChange={(e) => setComentarioSupervisor(e.target.value)}
                  placeholder="Comentarios u observaciones de supervisión que se envían al técnico..."
                  className="modern-input"
                />
              </div>
            </div>
            <div className="modern-card-footer flex justify-end">
              <button
                onClick={handleSaveChanges}
                disabled={saving || actionLoading}
                className="btn-modern-primary text-xs px-4 py-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios del Formulario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Column: AI JSON & Other Reports of Same Equipment */}
        <div className="space-y-5">
          {/* Collapsible raw_ia */}
          <div className="modern-card">
            <div className="modern-card-header">
              <button
                onClick={() => setShowRawIa(!showRawIa)}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <span className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span>Datos Estructurados del Modelo</span>
                </span>
                {showRawIa ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            {showRawIa && (
              <div className="modern-card-body p-3">
                <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800">
                  {JSON.stringify(reporte.raw_ia || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Otros reportes del mismo equipo */}
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Historial del mismo equipo
              </h3>
              {reporte.equipo && (
                <Link
                  href={`/equipos/${encodeURIComponent(reporte.codigo_equipo || reporte.equipo)}`}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Ver todo
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="modern-card-body p-3 space-y-2">
              {otrosReportesEquipo.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-2">
                  No hay otros reportes registrados para este equipo.
                </p>
              ) : (
                otrosReportesEquipo.map((o) => (
                  <Link
                    key={o.id}
                    href={`/reportes/${o.id}`}
                    className="block p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatReporteNumero(o.numero)}
                      </span>
                      <EstadoBadge estado={o.estado} />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                      {o.falla || 'Sin falla reportada'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatFechaHoraLima(o.created_at)} · {o.tecnico_nombre || 'Técnico'}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md modern-card shadow-dropdown border border-slate-200 dark:border-slate-800">
            <div className="modern-card-header bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                  Rechazar Reporte #{formatReporteNumero(reporte.numero)}
                </h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="modern-card-body space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Indica el motivo del rechazo. Este comentario será enviado automáticamente al técnico por Telegram para que envíe la corrección correspondiente.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo del rechazo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej. El código de equipo no corresponde; favor de indicar el tag correcto..."
                  className="modern-input"
                />
              </div>
            </div>

            <div className="modern-card-footer flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn-modern-default text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="btn-modern-danger text-xs"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Rechazo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
