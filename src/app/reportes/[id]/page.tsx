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
  cn,
  formatReporteNumero,
  formatFechaHoraLima,
  formatFechaLima,
  formatConfianza,
  formatSegundos,
  isReporteDemorado,
} from '@/lib/utils';
import type {
  Reporte,
  TipoMantenimiento,
  TipoNotificacion,
  ResponsableEjecutante,
  PrioridadReporte,
  RepuestoItem,
  Perfil,
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
  Users,
  Wrench,
  Check,
} from 'lucide-react';

export default function ReporteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const supabase = createClient();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [supervisorRevisor, setSupervisorRevisor] = useState<Perfil | null>(null);
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
  const [tipoNotificacion, setTipoNotificacion] = useState<TipoNotificacion | ''>('');
  const [falla, setFalla] = useState('');
  const [causaProbable, setCausaProbable] = useState('');
  const [actividades, setActividades] = useState<string[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoItem[]>([]);
  const [prioridad, setPrioridad] = useState<PrioridadReporte | ''>('');
  const [numeroOt, setNumeroOt] = useState('');
  const [fechaIntervencion, setFechaIntervencion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [responsablesEjecutantes, setResponsablesEjecutantes] = useState<ResponsableEjecutante[]>([]);
  const [duracionMinutos, setDuracionMinutos] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [comentarioSupervisor, setComentarioSupervisor] = useState('');
  const [intentadoGuardar, setIntentadoGuardar] = useState(false);

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
        setTipoNotificacion(r.tipo_notificacion || '');
        setFalla(r.falla || '');
        setCausaProbable(r.causa_probable || '');
        setActividades(Array.isArray(r.actividades) ? r.actividades : []);
        setRepuestos(Array.isArray(r.repuestos) ? (r.repuestos as RepuestoItem[]) : []);
        setPrioridad(r.prioridad || '');
        setNumeroOt(r.numero_ot || '');

        const fInterv = r.fecha_intervencion ? r.fecha_intervencion.slice(0, 10) : '';
        setFechaIntervencion(fInterv);
        setFechaInicio(r.fecha_inicio || fInterv);
        setHoraInicio(r.hora_inicio || '');
        setFechaFin(r.fecha_fin || fInterv);
        setHoraFin(r.hora_fin || '');

        // Cargar o inicializar lista de ejecutantes
        if (Array.isArray(r.responsables_ejecutantes) && r.responsables_ejecutantes.length > 0) {
          setResponsablesEjecutantes(r.responsables_ejecutantes);
        } else if (r.tecnico_nombre) {
          setResponsablesEjecutantes([{ nombre: r.tecnico_nombre, rol: 'TEC' }]);
        } else {
          setResponsablesEjecutantes([{ nombre: '', rol: 'TEC' }]);
        }

        setDuracionMinutos(r.duracion_minutos ?? '');
        setObservaciones(r.observaciones || '');
        setComentarioSupervisor(r.comentario_supervisor || '');

        // Cargar perfil del supervisor si fue revisado
        if (r.revisado_por) {
          const { data: perfilData } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', r.revisado_por)
            .single();
          if (perfilData) {
            setSupervisorRevisor(perfilData as Perfil);
          }
        } else {
          setSupervisorRevisor(null);
        }

        // Otros reportes del mismo equipo
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
      console.error('Error cargando reporte:', err);
      toast.error('Error al cargar la información del reporte');
    } finally {
      setLoading(false);
    }
  }, [id, supabase, toast]);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  // Validación de incoherencia en fechas/horas
  const getFechaHoraError = (): string | null => {
    if (!fechaInicio && !horaInicio && !fechaFin && !horaFin) return null;
    if (fechaInicio && horaInicio && fechaFin && horaFin) {
      const start = new Date(`${fechaInicio}T${horaInicio}:00`);
      const end = new Date(`${fechaFin}T${horaFin}:00`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'El formato de fecha u hora es inválido.';
      }
      if (end.getTime() <= start.getTime()) {
        return 'Incoherencia temporal: La fecha y hora de término debe ser posterior a la fecha y hora de inicio.';
      }
    }
    return null;
  };

  const fechaHoraError = getFechaHoraError();

  // Recálculo automático de duración en minutos al completar fechas/horas válidas
  useEffect(() => {
    if (fechaInicio && horaInicio && fechaFin && horaFin) {
      const start = new Date(`${fechaInicio}T${horaInicio}:00`);
      const end = new Date(`${fechaFin}T${horaFin}:00`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime()) {
        const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        setDuracionMinutos(diffMinutes);
      }
    }
  }, [fechaInicio, horaInicio, fechaFin, horaFin]);

  // Validación de OT (debe contener 7 u 8 dígitos numéricos según regla)
  const cleanOt = numeroOt.trim();
  const otValida = cleanOt === '' || /^\d{7,8}$/.test(cleanOt);

  // Handlers para Responsables Ejecutantes
  const handleAddEjecutante = () => {
    setResponsablesEjecutantes([...responsablesEjecutantes, { nombre: '', rol: 'TEC' }]);
  };

  const handleUpdateEjecutante = (
    index: number,
    field: keyof ResponsableEjecutante,
    val: string
  ) => {
    const updated = [...responsablesEjecutantes];
    updated[index] = { ...updated[index], [field]: val } as ResponsableEjecutante;
    setResponsablesEjecutantes(updated);
  };

  const handleRemoveEjecutante = (index: number) => {
    setResponsablesEjecutantes(responsablesEjecutantes.filter((_, i) => i !== index));
  };

  // Handlers para Actividades dinámicas
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

  // Handlers para Repuestos
  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: null, codigo: null }]);
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

  // Guardar cambios manuales
  const handleSaveChanges = async () => {
    if (!reporte) return;
    setIntentadoGuardar(true);

    // 1. Validar obligatoriedad de fechas y horas
    if (!fechaInicio || !horaInicio || !fechaFin || !horaFin) {
      toast.error(
        'Campos obligatorios incompletos',
        'La fecha de inicio, hora de inicio, fecha de término y hora de término son obligatorias.'
      );
      return;
    }

    // 2. Validar coherencia temporal
    if (fechaHoraError) {
      toast.error('Incoherencia en fechas/horas', fechaHoraError);
      return;
    }

    // 3. Validar regla de OT (7 u 8 dígitos numéricos)
    if (cleanOt && !/^\d{7,8}$/.test(cleanOt)) {
      toast.error(
        'Número de OT incorrecto',
        'El número de OT debe contener exactamente 7 u 8 dígitos numéricos (ej. 5125076).'
      );
      return;
    }

    setSaving(true);
    try {
      const filtradosEjecutantes = responsablesEjecutantes.filter((e) => e.nombre.trim() !== '');
      const primerTecnico =
        filtradosEjecutantes.find((e) => e.rol === 'TEC')?.nombre ||
        filtradosEjecutantes[0]?.nombre ||
        reporte.tecnico_nombre;

      const payload: Partial<Reporte> = {
        equipo: equipo.trim() || null,
        codigo_equipo: codigoEquipo.trim() || null,
        area: area.trim() || null,
        tipo_mantenimiento: (tipoMantenimiento as TipoMantenimiento) || null,
        tipo_notificacion: (tipoNotificacion as TipoNotificacion) || null,
        falla: falla.trim() || null,
        causa_probable: causaProbable.trim() || null,
        actividades: actividades.filter((a) => a.trim() !== ''),
        repuestos: repuestos.filter((r) => r.nombre.trim() !== ''),
        prioridad: (prioridad as PrioridadReporte) || null,
        numero_ot: cleanOt || null,
        fecha_inicio: fechaInicio || null,
        hora_inicio: horaInicio || null,
        fecha_fin: fechaFin || null,
        hora_fin: horaFin || null,
        fecha_intervencion: fechaInicio ? `${fechaInicio}T00:00:00Z` : (fechaIntervencion ? `${fechaIntervencion}T00:00:00Z` : null),
        duracion_minutos: duracionMinutos === '' ? null : Number(duracionMinutos),
        tecnico_nombre: primerTecnico || null,
        responsables_ejecutantes: filtradosEjecutantes,
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

  // Validar reporte (Revisado)
  const handleValidate = async () => {
    if (!reporte) return;
    setIntentadoGuardar(true);

    if (!fechaInicio || !horaInicio || !fechaFin || !horaFin) {
      toast.error(
        'Validación requerida',
        'Debe completar los campos obligatorios de fecha y hora antes de validar.'
      );
      return;
    }
    if (fechaHoraError) {
      toast.error('Incoherencia en fechas/horas', fechaHoraError);
      return;
    }
    if (cleanOt && !/^\d{7,8}$/.test(cleanOt)) {
      toast.error(
        'Número de OT inválido',
        'El número de OT debe contener exactamente 7 u 8 dígitos numéricos (ej. 5125076).'
      );
      return;
    }

    setActionLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const filtradosEjecutantes = responsablesEjecutantes.filter((e) => e.nombre.trim() !== '');
      const primerTecnico =
        filtradosEjecutantes.find((e) => e.rol === 'TEC')?.nombre ||
        filtradosEjecutantes[0]?.nombre ||
        reporte.tecnico_nombre;

      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'revisado',
          revisado_por: user?.id || null,
          revisado_en: nowIso,
          comentario_supervisor: comentarioSupervisor.trim() || null,
          equipo: equipo.trim() || null,
          codigo_equipo: codigoEquipo.trim() || null,
          area: area.trim() || null,
          tipo_mantenimiento: (tipoMantenimiento as TipoMantenimiento) || null,
          tipo_notificacion: (tipoNotificacion as TipoNotificacion) || null,
          falla: falla.trim() || null,
          causa_probable: causaProbable.trim() || null,
          actividades: actividades.filter((a) => a.trim() !== ''),
          repuestos: repuestos.filter((r) => r.nombre.trim() !== ''),
          prioridad: (prioridad as PrioridadReporte) || null,
          numero_ot: cleanOt || null,
          fecha_inicio: fechaInicio || null,
          hora_inicio: horaInicio || null,
          fecha_fin: fechaFin || null,
          hora_fin: horaFin || null,
          fecha_intervencion: fechaInicio ? `${fechaInicio}T00:00:00Z` : null,
          duracion_minutos: duracionMinutos === '' ? null : Number(duracionMinutos),
          tecnico_nombre: primerTecnico || null,
          responsables_ejecutantes: filtradosEjecutantes,
          observaciones: observaciones.trim() || null,
        })
        .eq('id', reporte.id);

      if (error) {
        toast.error('Error al validar reporte', error.message);
      } else {
        toast.success('Reporte validado y aprobado exitosamente');
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

  // Rechazar reporte (Rechazado)
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
          'El motivo ha sido guardado y se enviará al técnico en Telegram vía webhook.'
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

  // Reabrir reporte a estado 'confirmado' para revisión
  const handleReopen = async () => {
    if (!reporte) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'confirmado',
          revisado_por: null,
          revisado_en: null,
        })
        .eq('id', reporte.id);

      if (error) {
        toast.error('Error al reabrir reporte', error.message);
      } else {
        toast.success('Reporte reabierto: listo para nueva revisión de supervisión');
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

  // Eliminar (Solo Admin)
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
        description="El reporte solicitado no existe o no tienes permisos para visualizarlo."
        actionLabel="Volver a reportes"
        actionIcon={<ArrowLeft className="w-4 h-4" />}
        onAction={() => router.push('/reportes')}
        className="py-16"
      />
    );
  }

  const faltantes = reporte.campos_faltantes || [];
  const demorado = isReporteDemorado(reporte.created_at, reporte.estado);
  const esPreventivo = tipoMantenimiento === 'preventivo';

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
          <span>Validar reporte</span>
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
          <span>Reabrir revisión</span>
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
        subtitle={`Intervención técnica registrada el ${formatFechaHoraLima(reporte.created_at)}`}
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Reportes', href: '/reportes' },
          { label: `#${formatReporteNumero(reporte.numero)}`, active: true },
        ]}
        actions={headerActions}
      />

      {/* Origin & Status Strip */}
      <Card className="p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Estado actual:</span>
              <EstadoBadge estado={reporte.estado} isDemorado={demorado} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Canal:</span>
              <OrigenBadge origen={reporte.origen} duracionSeg={reporte.audio_duracion_seg} />
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Tiempo de IA:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatSegundos(reporte.tiempo_procesamiento_ms ? Math.round(reporte.tiempo_procesamiento_ms / 1000) : null)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" title="Confianza orientativa estimada por el modelo">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Confianza IA:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatConfianza(reporte.confianza)}
              </span>
            </div>
          </div>

          {reporte.revisado_en && (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Validado el {formatFechaHoraLima(reporte.revisado_en)}
                {supervisorRevisor ? ` por ${supervisorRevisor.nombre}` : ''}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main 2 Columns: Sections 1 to 9 */}
        <div className="lg:col-span-2 space-y-5">
          {/* SECCIÓN 1: Identificación y Fechas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <CardTitle>1. Identificación y Horarios de Intervención</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Alerta de incoherencia temporal en fechas/horas */}
              {fechaHoraError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Alerta en fechas y horarios:</span>
                    <span>{fechaHoraError}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Número Oficial:</span>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {formatReporteNumero(reporte.numero)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Fecha de Registro en Telegram:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatFechaHoraLima(reporte.created_at)}
                  </span>
                </div>

                {/* Fecha y Hora de Inicio (Obligatorios) */}
                <div>
                  <label htmlFor="fecha-inicio" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Fecha de Inicio: <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="fecha-inicio"
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={cn(
                      "modern-input",
                      intentadoGuardar && !fechaInicio && "border-rose-500 ring-1 ring-rose-500"
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="hora-inicio" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Hora de Inicio: <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="hora-inicio"
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className={cn(
                      "modern-input",
                      intentadoGuardar && !horaInicio && "border-rose-500 ring-1 ring-rose-500"
                    )}
                  />
                </div>

                {/* Fecha y Hora de Término (Obligatorios) */}
                <div>
                  <label htmlFor="fecha-fin" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Fecha de Término: <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="fecha-fin"
                    type="date"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className={cn(
                      "modern-input",
                      intentadoGuardar && !fechaFin && "border-rose-500 ring-1 ring-rose-500"
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="hora-fin" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Hora de Término: <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="hora-fin"
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className={cn(
                      "modern-input",
                      intentadoGuardar && !horaFin && "border-rose-500 ring-1 ring-rose-500"
                    )}
                  />
                </div>

                {/* Duración y Total Horas-Hombre */}
                <div>
                  <label htmlFor="duracion-minutos" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Duración Total (minutos):
                  </label>
                  <input
                    id="duracion-minutos"
                    type="number"
                    min="0"
                    value={duracionMinutos}
                    onChange={(e) => setDuracionMinutos(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Se calcula automáticamente"
                    className="modern-input"
                  />
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Total de Horas-Hombre (H-H):</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {duracionMinutos && Number(duracionMinutos) > 0
                        ? `${((Number(duracionMinutos) / 60) * Math.max(1, responsablesEjecutantes.filter((e) => e.nombre.trim()).length || 1)).toFixed(1)} hrs`
                        : '—'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {responsablesEjecutantes.filter((e) => e.nombre.trim()).length || 1} ejecutante(s)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 2: Responsables Ejecutantes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <CardTitle>2. Responsables Ejecutantes</CardTitle>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                    {responsablesEjecutantes.length}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  onClick={handleAddEjecutante}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Añadir ejecutante
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <p className="text-[11px] text-slate-500">
                Indique cada técnico (TEC) o ayudante (AYD) que participó en el trabajo físico (soporta 2, 3 o más personas para la misma OT).
              </p>
              {responsablesEjecutantes.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg border-slate-300 dark:border-slate-700 text-slate-500">
                  No hay ejecutantes registrados. Pulsa "Añadir ejecutante" para registrar al personal de la OT.
                </div>
              ) : (
                <div className="space-y-2">
                  {responsablesEjecutantes.map((ej, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="font-mono text-slate-400 text-xs w-5">{index + 1}.</span>
                      <input
                        type="text"
                        value={ej.nombre}
                        onChange={(e) => handleUpdateEjecutante(index, 'nombre', e.target.value)}
                        placeholder="Nombre y Apellidos del personal..."
                        className="modern-input flex-1"
                      />
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateEjecutante(index, 'rol', 'TEC')}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs font-semibold transition-all',
                            ej.rol === 'TEC'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          TEC
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateEjecutante(index, 'rol', 'AYD')}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs font-semibold transition-all',
                            ej.rol === 'AYD'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          AYD
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEjecutante(index)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                        aria-label={`Eliminar ejecutante ${index + 1}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Registro origen Telegram */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-500">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Usuario de Telegram emisor:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {reporte.tecnico_nombre || 'No identificado'}
                    {reporte.tecnico_username && ` (@${reporte.tecnico_username})`}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Canal y Duración:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <OrigenBadge origen={reporte.origen} duracionSeg={reporte.audio_duracion_seg} />
                    {reporte.telegram_chat_id && (
                      <span className="font-mono text-[10px] text-slate-400">ID: {reporte.telegram_chat_id}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 3 y 4: Equipo, Área, Tipo de Notificación, Tipo de Intervención y OT */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <CardTitle>3 y 4. Equipo, Tipo de Notificación, Intervención y Orden de Trabajo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="equipo-nombre" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Equipo o Activo:
                  </label>
                  <input
                    id="equipo-nombre"
                    type="text"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value)}
                    placeholder="Ej. Turbina de vapor TV-01"
                    className="modern-input"
                  />
                </div>
                <div>
                  <label htmlFor="equipo-codigo" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código / Tag de Equipo:
                  </label>
                  <input
                    id="equipo-codigo"
                    type="text"
                    value={codigoEquipo}
                    onChange={(e) => setCodigoEquipo(e.target.value)}
                    placeholder="Ej. TV-01, FV 20501 A"
                    className="modern-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="equipo-area" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Área Operativa:
                  </label>
                  <input
                    id="equipo-area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Generación Eléctrica, Calderas"
                    className="modern-input"
                  />
                </div>

                {/* Tipo de Notificación: Parcial / Final */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Notificación:
                  </label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setTipoNotificacion(tipoNotificacion === 'parcial' ? '' : 'parcial')}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5',
                        tipoNotificacion === 'parcial'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {tipoNotificacion === 'parcial' && <Check className="w-3.5 h-3.5" />}
                      <span>Parcial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoNotificacion(tipoNotificacion === 'final' ? '' : 'final')}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5',
                        tipoNotificacion === 'final'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {tipoNotificacion === 'final' && <Check className="w-3.5 h-3.5" />}
                      <span>Final</span>
                    </button>
                  </div>
                </div>

                {/* Tipo de Mantenimiento con Mejora */}
                <div>
                  <label htmlFor="equipo-tipo-mant" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Mantenimiento:
                  </label>
                  <select
                    id="equipo-tipo-mant"
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value as TipoMantenimiento)}
                    className="modern-input"
                  >
                    <option value="">Seleccione tipo...</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="preventivo">Preventivo</option>
                    <option value="predictivo">Predictivo</option>
                    <option value="mejora">Mejora</option>
                    <option value="inspeccion">Inspección</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Número de OT con regla de 7 u 8 dígitos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="numero-ot" className="font-medium text-slate-700 dark:text-slate-300">
                      Número de Orden de Trabajo (OT):
                    </label>
                    {cleanOt && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                          otValida
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40'
                        )}
                      >
                        {otValida ? `✓ ${cleanOt.length} dígitos` : `⚠️ ${cleanOt.length} dígitos`}
                      </span>
                    )}
                  </div>
                  <input
                    id="numero-ot"
                    type="text"
                    value={numeroOt}
                    onChange={(e) => setNumeroOt(e.target.value)}
                    placeholder="Ej. 5125076 (7 u 8 dígitos)"
                    className={cn(
                      'modern-input font-mono',
                      cleanOt && !otValida && 'border-rose-500 ring-1 ring-rose-500'
                    )}
                  />
                  {cleanOt && !otValida && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                      ⚠️ El N° de OT debe contener exactamente 7 u 8 dígitos numéricos.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="prioridad-intervencion" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Prioridad de Atención:
                  </label>
                  <select
                    id="prioridad-intervencion"
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
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 5: Falla y Causa Probable */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <CardTitle>5. Falla y Causa Probable (Hecho vs Hipótesis)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="campo-falla-hecho" className="font-semibold text-slate-800 dark:text-slate-200">
                    Falla u Observación Constatada (Hecho Objetivo)
                  </label>
                  {esPreventivo && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Mantenimiento preventivo: no requiere inventar falla
                    </span>
                  )}
                </div>
                <textarea
                  id="campo-falla-hecho"
                  rows={2}
                  value={falla}
                  onChange={(e) => setFalla(e.target.value)}
                  placeholder={
                    esPreventivo
                      ? 'Describa el motivo preventivo o inspección programada (opcional)...'
                      : 'Descripción objetiva del síntoma o avería detectada...'
                  }
                  className="modern-input"
                />
              </div>

              <div>
                <label htmlFor="campo-causa-hipotesis" className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Causa Probable (Hipótesis Técnica Preliminar)
                </label>
                <textarea
                  id="campo-causa-hipotesis"
                  rows={2}
                  value={causaProbable}
                  onChange={(e) => setCausaProbable(e.target.value)}
                  placeholder="Hipótesis u origen probable según inspección técnica (sujeto a validación)..."
                  className="modern-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 6: Actividades Realizadas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CardTitle>6. Actividades Realizadas</CardTitle>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                    {actividades.length}
                  </span>
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
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {actividades.length === 0 ? (
                <p className="text-slate-400 italic py-2">No se han registrado actividades técnicas.</p>
              ) : (
                actividades.map((act, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-xs w-4">{index + 1}.</span>
                    <input
                      type="text"
                      value={act}
                      onChange={(e) => handleUpdateActividad(index, e.target.value)}
                      placeholder="Describa la tarea ejecutada..."
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
                ))
              )}
            </CardContent>
          </Card>

          {/* SECCIÓN 7: Repuestos Empleados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CardTitle>7. Repuestos y Materiales Empleados</CardTitle>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
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
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {repuestos.length === 0 ? (
                <p className="text-slate-400 italic py-2">No se mencionaron repuestos ni consumibles utilizados.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-500 uppercase px-1">
                    <div className="col-span-6">Nombre de Componente</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-3">Código / Tag</div>
                    <div className="col-span-1"></div>
                  </div>
                  {repuestos.map((rep, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={rep.nombre}
                          onChange={(e) => handleUpdateRepuesto(index, 'nombre', e.target.value)}
                          placeholder="Nombre del componente..."
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
                          placeholder="Código / Parte"
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
            </CardContent>
          </Card>

          {/* SECCIÓN 8: Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>8. Observaciones Generales de la Intervención</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones de campo, advertencias técnicas o pendientes para el siguiente turno..."
                className="modern-input"
              />
            </CardContent>
          </Card>

          {/* SECCIÓN 9: Transcripción / Texto Original y Correcciones */}
          <Card>
            <CardHeader>
              <CardTitle>9. Mensaje Original y Correcciones de Telegram</CardTitle>
              <span className="text-xs text-slate-500">
                {reporte.origen === 'audio' ? 'Transcripción Whisper' : 'Texto escrito'}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                  Relato original transmitido:
                </p>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {reporte.texto_original || 'Sin texto original registrado.'}
                </p>
              </div>

              {reporte.texto_correccion && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] mb-1.5">
                    Corrección posterior enviada por el técnico en Telegram:
                  </p>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                    {reporte.texto_correccion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Sections 10, 11 and Equipment History */}
        <div className="space-y-5">
          {/* SECCIÓN 10: Auditoría y Confianza de IA */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <CardTitle>10. Auditoría de Extracción por IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Nivel de Confianza:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {formatConfianza(reporte.confianza)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Nota orientativa: Representa la estimación del modelo sobre la claridad del relato técnico. No reemplaza la inspección del supervisor.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block mb-1">Campos faltantes detectados:</span>
                {faltantes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {faltantes.map((f, i) => (
                      <span
                        key={i}
                        className="bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-600 font-medium">Información completa según extractor</span>
                )}
              </div>

              {/* Botón visor JSON */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRawIa(!showRawIa)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ver JSON Estructurado IA</span>
                  </span>
                  {showRawIa ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {showRawIa && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-slate-950 text-emerald-400 text-[10px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                    {JSON.stringify(reporte.raw_ia || {}, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN 11: Estado y Revisión de Supervisión */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <CardTitle>11. Estado y Resolución de Supervisión</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Estado de Revisión:</span>
                <EstadoBadge estado={reporte.estado} isDemorado={demorado} />
              </div>

              {supervisorRevisor && (
                <div>
                  <span className="text-slate-500 block mb-1">Revisado Por:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {supervisorRevisor.nombre} ({supervisorRevisor.rol})
                  </span>
                </div>
              )}

              {reporte.revisado_en && (
                <div>
                  <span className="text-slate-500 block mb-1">Fecha de Revisión:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {formatFechaHoraLima(reporte.revisado_en)}
                  </span>
                </div>
              )}

              <div>
                <label htmlFor="comentario-supervisor" className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Comentario u Observación de Supervisión:
                </label>
                <textarea
                  id="comentario-supervisor"
                  rows={3}
                  value={comentarioSupervisor}
                  onChange={(e) => setComentarioSupervisor(e.target.value)}
                  placeholder="Escriba comentarios para el técnico (se envían a Telegram al validar o rechazar)..."
                  className="modern-input"
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveChanges}
                isLoading={saving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Guardar comentario
              </Button>
            </CardFooter>
          </Card>

          {/* Historial del mismo equipo */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Historial de este Equipo</CardTitle>
              {reporte.equipo && (
                <Link
                  href={`/equipos/${encodeURIComponent(reporte.codigo_equipo || reporte.equipo)}`}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Ver todo
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-xs">
              {otrosReportesEquipo.length === 0 ? (
                <p className="text-slate-400 italic p-2 text-center text-xs">
                  No hay otros reportes registrados para este equipo.
                </p>
              ) : (
                otrosReportesEquipo.map((o) => (
                  <Link
                    key={o.id}
                    href={`/reportes/${o.id}`}
                    className="block p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {formatReporteNumero(o.numero)}
                      </span>
                      <EstadoBadge estado={o.estado} />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                      {o.falla || 'Intervención de mantenimiento'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatFechaLima(o.created_at)} · {o.tecnico_nombre || 'Técnico'}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Rechazar Reporte */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Rechazar Reporte #${formatReporteNumero(reporte.numero)}`}
        description="Indica el motivo del rechazo. Este comentario será enviado automáticamente al técnico por Telegram vía webhook para su corrección."
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

      {/* Modal Validar Reporte */}
      <ConfirmDialog
        isOpen={showValidateConfirm}
        onClose={() => setShowValidateConfirm(false)}
        onConfirm={handleValidate}
        title="Validar y Aprobar Reporte"
        message={`¿Confirmas la validación técnica del reporte #${formatReporteNumero(reporte.numero)}? Se registrará como revisado y se notificará al técnico.`}
        confirmLabel="Validar Reporte"
        variant="primary"
        isLoading={actionLoading}
      />

      {/* Modal Reabrir Reporte */}
      <ConfirmDialog
        isOpen={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={handleReopen}
        title="Reabrir Reporte para Revisión"
        message={`¿Deseas devolver el reporte #${formatReporteNumero(reporte.numero)} a estado 'Confirmado' para permitir una nueva revisión por supervisión?`}
        confirmLabel="Reabrir Reporte"
        variant="warning"
        isLoading={actionLoading}
      />

      {/* Modal Eliminar Reporte */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Reporte"
        message={`¿Estás seguro de que deseas eliminar permanentemente el reporte #${formatReporteNumero(reporte.numero)}? Esta acción es irreversible y solo está disponible para administradores.`}
        confirmLabel="Eliminar Definitivamente"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
