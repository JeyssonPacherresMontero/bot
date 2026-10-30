'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
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
        setActividades(r.actividades || []);
        setRepuestos(r.repuestos || []);
        setPrioridad(r.prioridad || '');
        setNumeroOt(r.numero_ot || '');
        setFechaIntervencion(r.fecha_intervencion || '');
        setDuracionMinutos(r.duracion_minutos ?? '');
        setObservaciones(r.observaciones || '');
        setComentarioSupervisor(r.comentario_supervisor || '');

        // Fetch other reports for this equipment
        if (r.equipo) {
          const { data: otros } = await supabase
            .from('reportes')
            .select('*')
            .eq('equipo', r.equipo)
            .neq('id', r.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (otros) {
            setOtrosReportesEquipo(otros as Reporte[]);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  // Activity handlers
  const handleAddActividad = () => {
    setActividades([...actividades, '']);
  };

  const handleUpdateActividad = (index: number, val: string) => {
    const list = [...actividades];
    list[index] = val;
    setActividades(list);
  };

  const handleRemoveActividad = (index: number) => {
    setActividades(actividades.filter((_, i) => i !== index));
  };

  // Repuesto handlers
  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: 1, codigo: null }]);
  };

  const handleUpdateRepuesto = (index: number, field: keyof RepuestoItem, val: unknown) => {
    const list = [...repuestos];
    list[index] = { ...list[index], [field]: val };
    setRepuestos(list);
  };

  const handleRemoveRepuesto = (index: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  // Save changes (Without changing state)
  const handleSaveChanges = async () => {
    if (!reporte) return;
    setSaving(true);
    try {
      const cleanActividades = actividades.map((a) => a.trim()).filter(Boolean);
      const cleanRepuestos = repuestos.filter((r) => r.nombre.trim());

      const { error } = await supabase
        .from('reportes')
        .update({
          equipo: equipo.trim() || null,
          codigo_equipo: codigoEquipo.trim() || null,
          area: area.trim() || null,
          tipo_mantenimiento: tipoMantenimiento || null,
          falla: falla.trim() || null,
          causa_probable: causaProbable.trim() || null,
          actividades: cleanActividades,
          repuestos: cleanRepuestos,
          prioridad: prioridad || null,
          numero_ot: numeroOt.trim() || null,
          fecha_intervencion: fechaIntervencion || null,
          duracion_minutos: duracionMinutos === '' ? null : Number(duracionMinutos),
          observaciones: observaciones.trim() || null,
          comentario_supervisor: comentarioSupervisor.trim() || null,
        })
        .eq('id', reporte.id);

      if (error) {
        alert(`Error al guardar cambios: ${error.message}`);
      } else {
        alert('Cambios guardados exitosamente.');
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
        alert('Reporte marcado como validado (revisado).');
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
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Reporte no encontrado
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          El reporte solicitado no existe o no cuentas con los permisos necesarios.
        </p>
        <Link
          href="/reportes"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la lista</span>
        </Link>
      </div>
    );
  }

  const faltantes = reporte.campos_faltantes || [];
  const demorado = isReporteDemorado(reporte.created_at, reporte.estado);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reportes"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900 dark:text-slate-100">
                {formatReporteNumero(reporte.numero)}
              </span>
              <EstadoBadge estado={reporte.estado} isDemorado={demorado} />
              {demorado && (
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  +24h sin revisión
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registrado el {formatFechaHoraLima(reporte.created_at)} por{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {reporte.tecnico_nombre || 'Técnico desconocido'}
              </span>
            </p>
          </div>
        </div>

        {/* Supervisor Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveChanges}
            disabled={saving || actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600" />}
            <span>Guardar cambios</span>
          </button>

          {reporte.estado !== 'revisado' && (
            <button
              onClick={handleValidate}
              disabled={actionLoading || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Rechazar</span>
            </button>
          )}

          {(reporte.estado === 'revisado' || reporte.estado === 'rechazado') && (
            <button
              onClick={handleReopen}
              disabled={actionLoading || saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reabrir</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={actionLoading || saving}
              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
              title="Eliminar reporte (Solo Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Origin & Metadata Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Origen:</span>
          <OrigenBadge origen={reporte.origen} duracionSeg={reporte.audio_duracion_seg} />
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400">Tiempo procesamiento IA:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatSegundos(reporte.tiempo_procesamiento_ms ? Math.round(reporte.tiempo_procesamiento_ms / 1000) : null)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-500 dark:text-slate-400">Certeza de extracción:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatConfianza(reporte.confianza)}
          </span>
        </div>
        {reporte.correcciones > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-semibold text-[11px]">
            <span>{reporte.correcciones} corrección(es) del técnico</span>
          </div>
        )}
        {reporte.revisado_en && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Revisado el {formatFechaHoraLima(reporte.revisado_en)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Transcriptions & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: "Lo que dijo el técnico" */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Lo que dijo el técnico
            </h2>

            {/* Original message */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Relato Original {reporte.origen === 'audio' ? '(Transcripción Whisper)' : '(Texto enviado)'}:
              </p>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {reporte.texto_original || 'Sin texto original registrado.'}
              </p>
            </div>

            {/* Correction message */}
            {reporte.texto_correccion && (
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-xs">
                <p className="font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider text-[10px] mb-1">
                  Última Corrección enviada por el técnico en Telegram:
                </p>
                <p className="text-orange-900 dark:text-orange-200 leading-relaxed whitespace-pre-wrap">
                  {reporte.texto_correccion}
                </p>
              </div>
            )}
          </div>

          {/* Section: Formulario editable de campos extraídos */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Campos Extraídos por MaintAI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Puedes corregir o completar la información técnica antes de validar.
                </p>
              </div>

              {faltantes.length > 0 && (
                <div className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Faltantes: {faltantes.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Equipo */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equipo {faltantes.includes('equipo') && <span className="text-red-500 font-bold">*Faltante</span>}
                </label>
                <input
                  type="text"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Ej. Turbina de vapor TV-01"
                  className={`w-full p-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                    faltantes.includes('equipo')
                      ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* Codigo Equipo */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Equipo / Tag
                </label>
                <input
                  type="text"
                  value={codigoEquipo}
                  onChange={(e) => setCodigoEquipo(e.target.value)}
                  placeholder="Ej. P-101A, TV-01, CALD-2"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Area */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Área de Planta
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej. Sala de Turbinas, SE-1, Recuperación de Condensados"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Tipo Mantenimiento */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Mantenimiento
                </label>
                <select
                  value={tipoMantenimiento}
                  onChange={(e) => setTipoMantenimiento(e.target.value as TipoMantenimiento)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prioridad
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as PrioridadReporte)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Orden de Trabajo (OT)
                </label>
                <input
                  type="text"
                  value={numeroOt}
                  onChange={(e) => setNumeroOt(e.target.value)}
                  placeholder="Ej. OT-2026-442"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Fecha Intervención */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Intervención
                </label>
                <input
                  type="date"
                  value={fechaIntervencion}
                  onChange={(e) => setFechaIntervencion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Duración en minutos */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duración de Intervención (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={duracionMinutos}
                  onChange={(e) =>
                    setDuracionMinutos(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Ej. 60"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Falla (Full Width) */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Falla / Síntoma Observado {faltantes.includes('falla') && <span className="text-red-500 font-bold">*Faltante</span>}
              </label>
              <textarea
                rows={2}
                value={falla}
                onChange={(e) => setFalla(e.target.value)}
                placeholder="Descripción del síntoma o anomalía reportada..."
                className={`w-full p-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                  faltantes.includes('falla')
                    ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            {/* Causa Probable */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Causa Probable
              </label>
              <textarea
                rows={2}
                value={causaProbable}
                onChange={(e) => setCausaProbable(e.target.value)}
                placeholder="Origen probable determinado tras la inspección..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Actividades (Editable list) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Actividades Ejecutadas ({actividades.length})</span>
                  {faltantes.includes('actividades') && (
                    <span className="text-red-500 font-bold">*Faltante</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleAddActividad}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir actividad</span>
                </button>
              </div>

              {actividades.length === 0 ? (
                <p className="text-slate-400 italic py-2">No se han registrado actividades.</p>
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
                        className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveActividad(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repuestos (Editable table) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Repuestos y Materiales Empleados ({repuestos.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddRepuesto}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir repuesto</span>
                </button>
              </div>

              {repuestos.length === 0 ? (
                <p className="text-slate-400 italic py-2">No se indicaron repuestos utilizados.</p>
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
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
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
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
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
                          placeholder="Código / Parte"
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRepuesto(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones Generales
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales o recomendaciones para el próximo turno..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Comentario Supervisor */}
            <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comentario del Supervisor
              </label>
              <textarea
                rows={2}
                value={comentarioSupervisor}
                onChange={(e) => setComentarioSupervisor(e.target.value)}
                placeholder="Comentarios u observaciones de supervisión que se notifican a Telegram..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column: AI JSON & Other Reports of Same Equipment */}
        <div className="space-y-6">
          {/* Collapsible raw_ia */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <button
              onClick={() => setShowRawIa(!showRawIa)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Extracción Cruda de IA (JSON)
              </span>
              {showRawIa ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showRawIa && (
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-96">
                {JSON.stringify(reporte.raw_ia || {}, null, 2)}
              </pre>
            )}
          </div>

          {/* Otros reportes del mismo equipo */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Historial del mismo equipo
              </h3>
              {reporte.equipo && (
                <Link
                  href={`/equipos/${encodeURIComponent(reporte.codigo_equipo || reporte.equipo)}`}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  Ver todo
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {otrosReportesEquipo.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No hay otros reportes registrados para este equipo.
              </p>
            ) : (
              <div className="space-y-2.5">
                {otrosReportesEquipo.map((o) => (
                  <Link
                    key={o.id}
                    href={`/reportes/${o.id}`}
                    className="block p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatReporteNumero(o.numero)}
                      </span>
                      <EstadoBadge estado={o.estado} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                      {o.falla || 'Sin falla reportada'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatFechaHoraLima(o.created_at)} · {o.tecnico_nombre || 'Técnico'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Rechazar Reporte {formatReporteNumero(reporte.numero)}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Indica de manera obligatoria el motivo del rechazo. Este comentario será enviado automáticamente al técnico por Telegram para que envíe la corrección.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo del rechazo <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. El código de equipo no corresponde; favor de indicar el tag correcto de la bomba..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmar Rechazo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
