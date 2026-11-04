'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
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
  const toast = useToast();
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

  // Dialog states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      toast.error('Error al cargar la información del reporte');
    } finally {
      setLoading(false);
    }
  }, [id, supabase, toast]);

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
        toast.error('Error al guardar cambios', error.message);
      } else {
        toast.success('Cambios guardados con éxito');
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Validate (Revisado)
  const handleValidate = async () => {
    if (!reporte) return;
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
        toast.error('Error al validar reporte', error.message);
      } else {
        toast.success('Reporte validado exitosamente');
        setShowValidateConfirm(false);
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
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
        toast.error('Error al rechazar reporte', error.message);
      } else {
        setShowRejectModal(false);
        toast.success(
          'Reporte rechazado',
          'El motivo ha sido registrado para notificación al técnico.'
        );
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reopen (Pendiente)
  const handleReopen = async () => {
    if (!reporte) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'pendiente',
        })
        .eq('id', reporte.id);

      if (error) {
        toast.error('Error al reabrir reporte', error.message);
      } else {
        toast.success('Reporte reabierto en estado pendiente');
        setShowReopenConfirm(false);
        loadReporte();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete (Admin only)
  const handleDelete = async () => {
    if (!reporte || !isAdmin) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('reportes').delete().eq('id', reporte.id);

      if (error) {
        toast.error('Error al eliminar reporte', error.message);
      } else {
        toast.success('Reporte eliminado con éxito');
        router.push('/reportes');
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!reporte) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Reporte no encontrado"
        description="El reporte solicitado no existe o fue eliminado del sistema."
        actionLabel="Volver al listado"
        actionIcon={<ArrowLeft className="w-4 h-4" />}
        onAction={() => router.push('/reportes')}
        className="py-16"
      />
    );
  }

  const faltantes = reporte.campos_faltantes || [];
  const demorado = isReporteDemorado(reporte.created_at, reporte.estado);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/reportes">
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          <span>Volver</span>
        </Button>
      </Link>

      <Button
        variant="primary"
        size="sm"
        onClick={handleSaveChanges}
        isLoading={saving}
        disabled={actionLoading}
        leftIcon={<Save className="w-3.5 h-3.5" />}
      >
        <span>Guardar cambios</span>
      </Button>

      {reporte.estado !== 'revisado' && (
        <Button
          variant="success"
          size="sm"
          onClick={() => setShowValidateConfirm(true)}
          disabled={actionLoading || saving}
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
        >
          <span>Validar</span>
        </Button>
      )}

      {reporte.estado !== 'rechazado' && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setRejectReason(reporte.comentario_supervisor || '');
            setShowRejectModal(true);
          }}
          disabled={actionLoading || saving}
          leftIcon={<XCircle className="w-3.5 h-3.5" />}
        >
          <span>Rechazar</span>
        </Button>
      )}

      {(reporte.estado === 'revisado' || reporte.estado === 'rechazado') && (
        <Button
          variant="warning"
          size="sm"
          onClick={() => setShowReopenConfirm(true)}
          disabled={actionLoading || saving}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          <span>Reabrir</span>
        </Button>
      )}

      {isAdmin && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={actionLoading || saving}
          aria-label="Eliminar reporte (Solo administradores)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
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
      <Card className="p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main 2 Columns: Transcriptions & Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section: Relato Original del Técnico */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <CardTitle>Relato Original del Técnico</CardTitle>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {reporte.origen === 'audio' ? 'Transcripción Whisper' : 'Texto directo Telegram'}
              </span>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                  Texto Transcrito:
                </p>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reporte.texto_original || 'Sin texto original registrado.'}
                </p>
              </div>

              {reporte.texto_correccion && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] mb-1.5">
                    Corrección posterior enviada por el técnico:
                  </p>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                    {reporte.texto_correccion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section: Formulario editable de campos extraídos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Campos Estructurados de la Intervención</CardTitle>
              </div>
              {faltantes.length > 0 && (
                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pendientes: {faltantes.join(', ')}</span>
                </span>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Equipo */}
                <div>
                  <label htmlFor="campo-equipo" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipo {faltantes.includes('equipo') && <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px] ml-1">* Requerido</span>}
                  </label>
                  <input
                    id="campo-equipo"
                    type="text"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value)}
                    placeholder="Ej. Turbina de vapor TV-01"
                    className={`modern-input ${faltantes.includes('equipo') ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20' : ''}`}
                  />
                </div>

                {/* Codigo Equipo */}
                <div>
                  <label htmlFor="campo-codigo-equipo" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Código o Tag de Equipo
                  </label>
                  <input
                    id="campo-codigo-equipo"
                    type="text"
                    value={codigoEquipo}
                    onChange={(e) => setCodigoEquipo(e.target.value)}
                    placeholder="Ej. P-101A, TV-01, CALD-2"
                    className="modern-input font-mono"
                  />
                </div>

                {/* Area */}
                <div>
                  <label htmlFor="campo-area" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Área de Planta
                  </label>
                  <input
                    id="campo-area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Sala de Turbinas, Condensados"
                    className="modern-input"
                  />
                </div>

                {/* Tipo Mantenimiento */}
                <div>
                  <label htmlFor="campo-tipo" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Mantenimiento
                  </label>
                  <select
                    id="campo-tipo"
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
                  <label htmlFor="campo-prioridad" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    id="campo-prioridad"
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
                  <label htmlFor="campo-ot" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de Orden de Trabajo
                  </label>
                  <input
                    id="campo-ot"
                    type="text"
                    value={numeroOt}
                    onChange={(e) => setNumeroOt(e.target.value)}
                    placeholder="Ej. OT-2026-442"
                    className="modern-input font-mono"
                  />
                </div>

                {/* Fecha Intervención */}
                <div>
                  <label htmlFor="campo-fecha-intervencion" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha de Intervención
                  </label>
                  <input
                    id="campo-fecha-intervencion"
                    type="date"
                    value={fechaIntervencion}
                    onChange={(e) => setFechaIntervencion(e.target.value)}
                    className="modern-input"
                  />
                </div>

                {/* Duración en minutos */}
                <div>
                  <label htmlFor="campo-duracion" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Duración Estimada en Minutos
                  </label>
                  <input
                    id="campo-duracion"
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

              {/* Falla */}
              <div className="text-xs">
                <label htmlFor="campo-falla" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Falla Observada {faltantes.includes('falla') && <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px] ml-1">* Requerido</span>}
                </label>
                <textarea
                  id="campo-falla"
                  rows={2}
                  value={falla}
                  onChange={(e) => setFalla(e.target.value)}
                  placeholder="Descripción de la anomalía o falla reportada..."
                  className={`modern-input ${faltantes.includes('falla') ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20' : ''}`}
                />
              </div>

              {/* Causa Probable */}
              <div className="text-xs">
                <label htmlFor="campo-causa" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Causa Probable Determinada
                </label>
                <textarea
                  id="campo-causa"
                  rows={2}
                  value={causaProbable}
                  onChange={(e) => setCausaProbable(e.target.value)}
                  placeholder="Origen probable determinado tras la inspección..."
                  className="modern-input"
                />
              </div>

              {/* Actividades */}
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
                      <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">* Requerido</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleAddActividad}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Añadir actividad
                  </Button>
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
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          aria-label={`Eliminar actividad ${index + 1}`}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Repuestos */}
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
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleAddRepuesto}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Añadir repuesto
                  </Button>
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
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            aria-label={`Eliminar repuesto ${index + 1}`}
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
              <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <label htmlFor="campo-observaciones" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Observaciones Generales
                </label>
                <textarea
                  id="campo-observaciones"
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales o recomendaciones para el próximo turno..."
                  className="modern-input"
                />
              </div>

              {/* Comentario Supervisor */}
              <div className="text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <label htmlFor="campo-comentario-sup" className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Comentario de Supervisión para el Técnico
                </label>
                <textarea
                  id="campo-comentario-sup"
                  rows={2}
                  value={comentarioSupervisor}
                  onChange={(e) => setComentarioSupervisor(e.target.value)}
                  placeholder="Comentarios u observaciones de supervisión que se envían al técnico..."
                  className="modern-input"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveChanges}
                isLoading={saving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Guardar Cambios del Formulario
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Column: AI JSON & Other Reports of Same Equipment */}
        <div className="space-y-5">
          {/* Collapsible raw_ia */}
          <Card>
            <CardHeader className="p-3.5">
              <button
                onClick={() => setShowRawIa(!showRawIa)}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <span className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span>Datos Estructurados del Modelo</span>
                </span>
                {showRawIa ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
            </CardHeader>

            {showRawIa && (
              <CardContent className="p-3">
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800">
                  {JSON.stringify(reporte.raw_ia || {}, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>

          {/* Otros reportes del mismo equipo */}
          <Card>
            <CardHeader>
              <CardTitle>Historial del mismo equipo</CardTitle>
              {reporte.equipo && (
                <Link
                  href={`/equipos/${encodeURIComponent(reporte.codigo_equipo || reporte.equipo)}`}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                >
                  Ver todo
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </CardHeader>

            <CardContent className="p-3 space-y-2">
              {otrosReportesEquipo.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-2 text-center">
                  No hay otros reportes registrados para este equipo.
                </p>
              ) : (
                otrosReportesEquipo.map((o) => (
                  <Link
                    key={o.id}
                    href={`/reportes/${o.id}`}
                    className="block p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accessible Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Rechazar Reporte #${formatReporteNumero(reporte.numero)}`}
        description="Indica el motivo del rechazo. Este comentario será enviado automáticamente al técnico por Telegram para que envíe la corrección correspondiente."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="modal-reject-reason" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo del rechazo <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="modal-reject-reason"
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej. El código de equipo no corresponde; favor de indicar el tag correcto..."
              className="modern-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectModal(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim()}
              isLoading={actionLoading}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Validate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showValidateConfirm}
        onClose={() => setShowValidateConfirm(false)}
        onConfirm={handleValidate}
        title="Validar Reporte"
        message={`¿Confirmas la validación técnica del reporte #${formatReporteNumero(reporte.numero)}? Se registrará como revisado.`}
        confirmLabel="Validar Reporte"
        variant="primary"
        isLoading={actionLoading}
      />

      {/* Reopen Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={handleReopen}
        title="Reabrir Reporte"
        message={`¿Deseas devolver el reporte #${formatReporteNumero(reporte.numero)} a estado pendiente para su posterior corrección?`}
        confirmLabel="Reabrir a Pendiente"
        variant="warning"
        isLoading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Reporte"
        message={`¿Estás seguro de que deseas eliminar permanentemente el reporte #${formatReporteNumero(reporte.numero)}? Esta acción es irreversible.`}
        confirmLabel="Eliminar Definitivamente"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}