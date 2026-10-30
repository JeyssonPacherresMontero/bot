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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[#e9ecef] dark:bg-[#343a40] rounded-[0.25rem] animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="p-12 text-center lte-card border-t-[3px] border-t-[#dc3545]">
        <AlertTriangle className="w-12 h-12 text-[#ffc107] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#212529] dark:text-[#f8f9fa]">
          Reporte no encontrado
        </h2>
        <p className="text-xs text-[#6c757d] dark:text-[#ced4da] mt-1">
          El reporte solicitado no existe o no cuentas con los permisos necesarios.
        </p>
        <Link href="/reportes" className="btn-lte-primary text-xs mt-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al listado</span>
        </Link>
      </div>
    );
  }

  const faltantes = reporte.campos_faltantes || [];
  const demorado = isReporteDemorado(reporte.created_at, reporte.estado);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href="/reportes" className="btn-lte-default text-xs">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver</span>
      </Link>

      <button
        onClick={handleSaveChanges}
        disabled={saving || actionLoading}
        className="btn-lte-primary text-xs"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span>Guardar cambios</span>
      </button>

      {reporte.estado !== 'revisado' && (
        <button
          onClick={handleValidate}
          disabled={actionLoading || saving}
          className="btn-lte-success text-xs"
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
          className="btn-lte-danger text-xs"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rechazar</span>
        </button>
      )}

      {(reporte.estado === 'revisado' || reporte.estado === 'rechazado') && (
        <button
          onClick={handleReopen}
          disabled={actionLoading || saving}
          className="btn-lte-warning text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reabrir</span>
        </button>
      )}

      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={actionLoading || saving}
          className="btn-lte-danger text-xs"
          title="Eliminar reporte (Solo Admin)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
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

      {/* Origin & Metadata Strip - AdminLTE Callout Style */}
      <div className="lte-card border-l-4 border-l-[#17a2b8] p-3 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#495057] dark:text-[#ced4da]">Estado:</span>
            <EstadoBadge estado={reporte.estado} isDemorado={demorado} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#495057] dark:text-[#ced4da]">Origen:</span>
            <OrigenBadge origen={reporte.origen} duracionSeg={reporte.audio_duracion_seg} />
          </div>
          <div className="flex items-center gap-1.5 text-[#6c757d] dark:text-[#adb5bd]">
            <Clock className="w-3.5 h-3.5 text-[#17a2b8]" />
            <span>Tiempo IA:</span>
            <span className="font-bold text-[#212529] dark:text-[#f8f9fa]">
              {formatSegundos(reporte.tiempo_procesamiento_ms ? Math.round(reporte.tiempo_procesamiento_ms / 1000) : null)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6c757d] dark:text-[#adb5bd]">
            <Sparkles className="w-3.5 h-3.5 text-[#28a745]" />
            <span>Confianza:</span>
            <span className="font-bold text-[#28a745]">
              {formatConfianza(reporte.confianza)}
            </span>
          </div>
        </div>

        {reporte.revisado_en && (
          <div className="flex items-center gap-1 text-[#28a745] font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Validado el {formatFechaHoraLima(reporte.revisado_en)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main 2 Columns: Transcriptions & Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section: "Lo que dijo el técnico" - Card Outline Info */}
          <div className="lte-card border-t-[3px] border-t-[#17a2b8]">
            <div className="lte-card-header">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#17a2b8]" />
                <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                  Relato Original del Técnico
                </span>
              </div>
              <span className="text-xs text-[#6c757d] dark:text-[#adb5bd]">
                {reporte.origen === 'audio' ? 'Transcripción Whisper' : 'Texto directo Telegram'}
              </span>
            </div>

            <div className="lte-card-body space-y-3">
              <div className="p-3 bg-[#f8f9fa] dark:bg-[#2c3338] rounded-[0.25rem] border border-[#dee2e6] dark:border-[#4b545c] text-xs">
                <p className="font-bold text-[#495057] dark:text-[#ced4da] uppercase tracking-wider text-[10px] mb-1">
                  Texto Transcrito:
                </p>
                <p className="text-[#212529] dark:text-[#f8f9fa] leading-relaxed whitespace-pre-wrap">
                  {reporte.texto_original || 'Sin texto original registrado.'}
                </p>
              </div>

              {reporte.texto_correccion && (
                <div className="p-3 bg-[#fff3cd] dark:bg-[#ffc107]/15 rounded-[0.25rem] border border-[#ffeeba] dark:border-[#ffc107]/40 text-xs">
                  <p className="font-bold text-[#856404] dark:text-[#ffc107] uppercase tracking-wider text-[10px] mb-1">
                    Corrección posterior enviada por el técnico:
                  </p>
                  <p className="text-[#856404] dark:text-[#ffeeba] leading-relaxed whitespace-pre-wrap">
                    {reporte.texto_correccion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Formulario editable de campos extraídos - Card Outline Primary */}
          <div className="lte-card border-t-[3px] border-t-[#007bff]">
            <div className="lte-card-header">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                  Campos Extraídos por MaintAI
                </span>
              </div>
              {faltantes.length > 0 && (
                <span className="bg-[#ffc107] text-[#1f2d3d] text-xs font-bold px-2 py-0.5 rounded-[0.2rem] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Faltantes: {faltantes.join(', ')}</span>
                </span>
              )}
            </div>

            <div className="lte-card-body space-y-4">
              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Equipo */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Equipo {faltantes.includes('equipo') && <span className="text-[#dc3545] font-bold">(*Faltante)</span>}
                  </label>
                  <input
                    type="text"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value)}
                    placeholder="Ej. Turbina de vapor TV-01"
                    className={`form-control-lte ${faltantes.includes('equipo') ? 'border-[#dc3545] bg-[#dc3545]/5' : ''}`}
                  />
                </div>

                {/* Codigo Equipo */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Código de Equipo / Tag
                  </label>
                  <input
                    type="text"
                    value={codigoEquipo}
                    onChange={(e) => setCodigoEquipo(e.target.value)}
                    placeholder="Ej. P-101A, TV-01, CALD-2"
                    className="form-control-lte font-mono"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Área de Planta
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Sala de Turbinas, Condensados"
                    className="form-control-lte"
                  />
                </div>

                {/* Tipo Mantenimiento */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Tipo de Mantenimiento
                  </label>
                  <select
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value as TipoMantenimiento)}
                    className="form-control-lte"
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
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as PrioridadReporte)}
                    className="form-control-lte"
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
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Número de Orden de Trabajo (OT)
                  </label>
                  <input
                    type="text"
                    value={numeroOt}
                    onChange={(e) => setNumeroOt(e.target.value)}
                    placeholder="Ej. OT-2026-442"
                    className="form-control-lte font-mono"
                  />
                </div>

                {/* Fecha Intervención */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Fecha de Intervención
                  </label>
                  <input
                    type="date"
                    value={fechaIntervencion}
                    onChange={(e) => setFechaIntervencion(e.target.value)}
                    className="form-control-lte"
                  />
                </div>

                {/* Duración en minutos */}
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Duración Estimada (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={duracionMinutos}
                    onChange={(e) =>
                      setDuracionMinutos(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej. 60"
                    className="form-control-lte"
                  />
                </div>
              </div>

              {/* Falla (Full Width) */}
              <div className="text-xs">
                <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                  Falla / Síntoma Observado {faltantes.includes('falla') && <span className="text-[#dc3545] font-bold">(*Faltante)</span>}
                </label>
                <textarea
                  rows={2}
                  value={falla}
                  onChange={(e) => setFalla(e.target.value)}
                  placeholder="Descripción de la anomalía o falla reportada..."
                  className={`form-control-lte ${faltantes.includes('falla') ? 'border-[#dc3545] bg-[#dc3545]/5' : ''}`}
                />
              </div>

              {/* Causa Probable */}
              <div className="text-xs">
                <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                  Causa Probable Determinada
                </label>
                <textarea
                  rows={2}
                  value={causaProbable}
                  onChange={(e) => setCausaProbable(e.target.value)}
                  placeholder="Origen probable determinado tras la inspección..."
                  className="form-control-lte"
                />
              </div>

              {/* Actividades (Editable list) */}
              <div className="space-y-2 pt-2 border-t border-[#dee2e6] dark:border-[#4b545c] text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#495057] dark:text-[#ced4da] flex items-center gap-1.5">
                    <span>Actividades Realizadas ({actividades.length})</span>
                    {faltantes.includes('actividades') && (
                      <span className="text-[#dc3545] font-bold">(*Faltante)</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddActividad}
                    className="btn-lte-primary text-xs py-1 px-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir actividad</span>
                  </button>
                </div>

                {actividades.length === 0 ? (
                  <p className="text-[#adb5bd] italic py-1">No se han registrado actividades.</p>
                ) : (
                  <div className="space-y-2">
                    {actividades.map((act, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-[#adb5bd] font-mono text-xs w-4">{index + 1}.</span>
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => handleUpdateActividad(index, e.target.value)}
                          placeholder="Ej. Desmontaje y cambio de sello mecánico..."
                          className="form-control-lte flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveActividad(index)}
                          className="btn-lte-danger py-1 px-2"
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
              <div className="space-y-2 pt-2 border-t border-[#dee2e6] dark:border-[#4b545c] text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#495057] dark:text-[#ced4da]">
                    Repuestos y Materiales Empleados ({repuestos.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRepuesto}
                    className="btn-lte-primary text-xs py-1 px-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir repuesto</span>
                  </button>
                </div>

                {repuestos.length === 0 ? (
                  <p className="text-[#adb5bd] italic py-1">No se indicaron repuestos utilizados.</p>
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
                            className="form-control-lte"
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
                            className="form-control-lte"
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
                            placeholder="Código / Tag"
                            className="form-control-lte font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRepuesto(index)}
                            className="btn-lte-danger py-1 px-2"
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
              <div className="text-xs pt-2 border-t border-[#dee2e6] dark:border-[#4b545c]">
                <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                  Observaciones Generales
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales o recomendaciones para el próximo turno..."
                  className="form-control-lte"
                />
              </div>

              {/* Comentario Supervisor */}
              <div className="text-xs pt-2 border-t border-[#dee2e6] dark:border-[#4b545c]">
                <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                  Comentario de Supervisión (Notificación al Técnico)
                </label>
                <textarea
                  rows={2}
                  value={comentarioSupervisor}
                  onChange={(e) => setComentarioSupervisor(e.target.value)}
                  placeholder="Comentarios u observaciones de supervisión que se envían al técnico..."
                  className="form-control-lte"
                />
              </div>
            </div>
            <div className="lte-card-footer flex justify-end">
              <button
                onClick={handleSaveChanges}
                disabled={saving || actionLoading}
                className="btn-lte-primary text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios del Formulario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Column: AI JSON & Other Reports of Same Equipment */}
        <div className="space-y-4">
          {/* Collapsible raw_ia - Card Outline Purple */}
          <div className="lte-card border-t-[3px] border-t-[#6f42c1]">
            <div className="lte-card-header">
              <button
                onClick={() => setShowRawIa(!showRawIa)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[#212529] dark:text-[#f8f9fa]"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#6f42c1]" />
                  Extracción Cruda de IA (JSON)
                </span>
                {showRawIa ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {showRawIa && (
              <div className="lte-card-body p-2">
                <pre className="p-3 rounded-[0.25rem] bg-[#212529] text-[#20c997] text-[11px] font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(reporte.raw_ia || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Otros reportes del mismo equipo - Card Outline Warning */}
          <div className="lte-card border-t-[3px] border-t-[#ffc107]">
            <div className="lte-card-header">
              <h3 className="text-xs font-bold text-[#212529] dark:text-[#f8f9fa]">
                Historial del mismo equipo
              </h3>
              {reporte.equipo && (
                <Link
                  href={`/equipos/${encodeURIComponent(reporte.codigo_equipo || reporte.equipo)}`}
                  className="text-[11px] font-bold text-[#007bff] hover:underline flex items-center gap-1"
                >
                  Ver todo
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="lte-card-body p-2 space-y-2">
              {otrosReportesEquipo.length === 0 ? (
                <p className="text-xs text-[#adb5bd] italic p-2">
                  No hay otros reportes registrados para este equipo.
                </p>
              ) : (
                otrosReportesEquipo.map((o) => (
                  <Link
                    key={o.id}
                    href={`/reportes/${o.id}`}
                    className="block p-2.5 rounded-[0.25rem] border border-[#dee2e6] dark:border-[#4b545c] bg-[#f8f9fa] dark:bg-[#2c3338] hover:bg-[#e9ecef] dark:hover:bg-[#384047] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#007bff]">
                        {formatReporteNumero(o.numero)}
                      </span>
                      <EstadoBadge estado={o.estado} />
                    </div>
                    <p className="text-xs font-medium text-[#212529] dark:text-[#f8f9fa] mt-1 line-clamp-1">
                      {o.falla || 'Sin falla reportada'}
                    </p>
                    <p className="text-[10px] text-[#6c757d] dark:text-[#adb5bd] mt-0.5">
                      {formatFechaHoraLima(o.created_at)} · {o.tecnico_nombre || 'Técnico'}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal - AdminLTE Modal Style */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md lte-card border-t-[4px] border-t-[#dc3545] shadow-lte-lg">
            <div className="lte-card-header bg-[#dc3545] text-white">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">
                  Rechazar Reporte #{formatReporteNumero(reporte.numero)}
                </h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-white hover:opacity-80"
              >
                &times;
              </button>
            </div>

            <div className="lte-card-body space-y-3">
              <p className="text-xs text-[#6c757d] dark:text-[#ced4da]">
                Indica de manera obligatoria el motivo del rechazo. Este comentario será enviado automáticamente al técnico por Telegram para que envíe la corrección.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                  Motivo del rechazo <span className="text-[#dc3545]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej. El código de equipo no corresponde; favor de indicar el tag correcto..."
                  className="form-control-lte"
                />
              </div>
            </div>

            <div className="lte-card-footer flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn-lte-default text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="btn-lte-danger text-xs"
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
