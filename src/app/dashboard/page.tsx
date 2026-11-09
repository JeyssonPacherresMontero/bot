'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton, KpiCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import {
  formatReporteNumero,
  formatFechaHoraLima,
  isReporteDemorado,
  formatMinutos,
  formatConfianza,
} from '@/lib/utils';
import type {
  Reporte,
  VKpiResumen,
  VReportesPorDia,
  VFallasPorEquipo,
  VRepuestosMasUsados,
  VReportesPorTecnico,
} from '@/types/database.types';
import {
  FileText,
  Clock,
  Sparkles,
  Timer,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<'hoy' | '7dias' | '30dias' | 'todo'>('30dias');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);

  const [kpi, setKpi] = useState<VKpiResumen | null>(null);
  const [reportesPorDia, setReportesPorDia] = useState<VReportesPorDia[]>([]);
  const [fallasPorEquipo, setFallasPorEquipo] = useState<VFallasPorEquipo[]>([]);
  const [repuestosMasUsados, setRepuestosMasUsados] = useState<VRepuestosMasUsados[]>([]);
  const [reportesPorTecnico, setReportesPorTecnico] = useState<VReportesPorTecnico[]>([]);
  const [distribucionTipo, setDistribucionTipo] = useState<{ name: string; value: number }[]>([]);
  const [distribucionPrioridad, setDistribucionPrioridad] = useState<{ name: string; value: number }[]>([]);
  const [distribucionEstado, setDistribucionEstado] = useState<{ name: string; value: number }[]>([]);
  const [reportesPendientes, setReportesPendientes] = useState<Reporte[]>([]);

  const supabase = createClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Calcula fecha de inicio según rango de fechas
  const getDateRangeFilter = useCallback(() => {
    const now = new Date();
    if (dateRange === 'hoy') {
      const todayLima = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
      todayLima.setHours(0, 0, 0, 0);
      return todayLima.toISOString();
    }
    if (dateRange === '7dias') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return past.toISOString();
    }
    if (dateRange === '30dias') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return past.toISOString();
    }
    return null;
  }, [dateRange]);

  const loadDashboardData = useCallback(async () => {
    try {
      const startDate = getDateRangeFilter();

      // Consulta de reportes para el período seleccionado
      let baseQuery = supabase.from('reportes').select('*');
      if (startDate) {
        baseQuery = baseQuery.gte('created_at', startDate);
      }

      const { data: periodReportes, error: repError } = await baseQuery.order('created_at', { ascending: false });

      if (repError) {
        console.error('Error cargando reportes para métricas:', repError);
      }

      const reportes = (periodReportes as Reporte[]) || [];

      // 1. Cálculo de KPIs reales en el período
      const total = reportes.length;
      const confirmadosPorRevisar = reportes.filter((r) => r.estado === 'confirmado').length;
      const revisados = reportes.filter((r) => r.estado === 'revisado').length;
      const rechazados = reportes.filter((r) => r.estado === 'rechazado').length;
      const pendientesHistoricos = reportes.filter((r) => r.estado === 'pendiente' || r.estado === 'corregido').length;

      const duraciones = reportes
        .map((r) => r.duracion_minutos)
        .filter((d): d is number => d !== null && d !== undefined && !isNaN(d) && d > 0);
      const duracionPromedio =
        duraciones.length > 0
          ? Math.round((duraciones.reduce((acc, v) => acc + v, 0) / duraciones.length) * 10) / 10
          : null;

      const confianzas = reportes
        .map((r) => r.confianza)
        .filter((c): c is number => c !== null && c !== undefined && !isNaN(c));
      const confianzaPromedio =
        confianzas.length > 0
          ? Math.round((confianzas.reduce((acc, v) => acc + v, 0) / confianzas.length) * 100) / 100
          : null;

      setKpi({
        total_reportes: total,
        confirmados_por_revisar: confirmadosPorRevisar,
        confirmados: confirmadosPorRevisar,
        revisados,
        rechazados,
        pendientes: confirmadosPorRevisar + pendientesHistoricos,
        pendientes_historicos: pendientesHistoricos,
        pct_sin_correccion: null,
        duracion_promedio_min: duracionPromedio,
        procesamiento_promedio_seg: null,
        confianza_promedio: confianzaPromedio,
      });

      // 2. Reportes por día (America/Lima)
      const dayMap: Record<string, number> = {};
      reportes.forEach((r) => {
        try {
          const d = new Date(r.created_at);
          const dia = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: '2-digit',
          }).format(d);
          dayMap[dia] = (dayMap[dia] || 0) + 1;
        } catch {
          // Ignore invalid dates
        }
      });
      const rDiaList: VReportesPorDia[] = Object.entries(dayMap).map(([dia, tot]) => ({
        dia,
        total: tot,
      }));
      setReportesPorDia(rDiaList);

      // 3. Fallas por equipo en el período
      const eqFallasMap: Record<string, { count: number; duraciones: number[]; ultimo: string }> = {};
      reportes.forEach((r) => {
        if (r.falla || r.tipo_mantenimiento === 'correctivo') {
          const eqKey = r.codigo_equipo || r.equipo || 'Sin equipo';
          const prev = eqFallasMap[eqKey] || { count: 0, duraciones: [], ultimo: r.created_at };
          prev.count += 1;
          if (r.duracion_minutos) prev.duraciones.push(r.duracion_minutos);
          if (new Date(r.created_at) > new Date(prev.ultimo)) prev.ultimo = r.created_at;
          eqFallasMap[eqKey] = prev;
        }
      });
      const fEquipoList: VFallasPorEquipo[] = Object.entries(eqFallasMap)
        .map(([equipo, val]) => ({
          equipo,
          total_fallas: val.count,
          duracion_promedio_min:
            val.duraciones.length > 0
              ? Math.round((val.duraciones.reduce((a, b) => a + b, 0) / val.duraciones.length) * 10) / 10
              : null,
          ultimo_reporte: val.ultimo,
        }))
        .sort((a, b) => b.total_fallas - a.total_fallas)
        .slice(0, 10);
      setFallasPorEquipo(fEquipoList);

      // 4. Repuestos más mencionados (sin inventar cantidades)
      const repMap: Record<string, { veces: number; unidades: number; tieneUnidades: boolean }> = {};
      reportes.forEach((r) => {
        (r.repuestos || []).forEach((item) => {
          if (item?.nombre && item.nombre.trim()) {
            const key = item.nombre.trim().toLowerCase();
            const prev = repMap[key] || { veces: 0, unidades: 0, tieneUnidades: false };
            prev.veces += 1;
            if (item.cantidad !== null && item.cantidad !== undefined && !isNaN(Number(item.cantidad))) {
              prev.unidades += Number(item.cantidad);
              prev.tieneUnidades = true;
            }
            repMap[key] = prev;
          }
        });
      });
      const repList: VRepuestosMasUsados[] = Object.entries(repMap)
        .map(([repuesto, val]) => ({
          repuesto,
          veces: val.veces,
          unidades_informadas: val.tieneUnidades ? val.unidades : null,
          unidades: val.tieneUnidades ? val.unidades : null,
        }))
        .sort((a, b) => b.veces - a.veces)
        .slice(0, 10);
      setRepuestosMasUsados(repList);

      // 5. Reportes por técnico
      const tecMap: Record<string, { count: number; duraciones: number[] }> = {};
      reportes.forEach((r) => {
        const tec = r.tecnico_nombre || 'Sin nombre registrado';
        const prev = tecMap[tec] || { count: 0, duraciones: [] };
        prev.count += 1;
        if (r.duracion_minutos) prev.duraciones.push(r.duracion_minutos);
        tecMap[tec] = prev;
      });
      const tecList: VReportesPorTecnico[] = Object.entries(tecMap)
        .map(([tecnico, val]) => ({
          tecnico,
          total: val.count,
          duracion_promedio_min:
            val.duraciones.length > 0
              ? Math.round((val.duraciones.reduce((a, b) => a + b, 0) / val.duraciones.length) * 10) / 10
              : null,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      setReportesPorTecnico(tecList);

      // 6. Distribuciones
      const tipoMap: Record<string, number> = {};
      const prioMap: Record<string, number> = {};
      const estMap: Record<string, number> = {};

      reportes.forEach((r) => {
        const t = r.tipo_mantenimiento || 'Sin especificar';
        tipoMap[t] = (tipoMap[t] || 0) + 1;

        const p = r.prioridad || 'Sin prioridad';
        prioMap[p] = (prioMap[p] || 0) + 1;

        const e = r.estado || 'Sin estado';
        estMap[e] = (estMap[e] || 0) + 1;
      });

      setDistribucionTipo(Object.entries(tipoMap).map(([name, value]) => ({ name, value })));
      setDistribucionPrioridad(Object.entries(prioMap).map(([name, value]) => ({ name, value })));
      setDistribucionEstado(Object.entries(estMap).map(([name, value]) => ({ name, value })));

      // 7. Lista prioritaria de reportes confirmados esperando revisión
      const pendientes = reportes
        .filter((r) => r.estado === 'confirmado' || r.estado === 'pendiente' || r.estado === 'corregido')
        .slice(0, 10);
      setReportesPendientes(pendientes);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDateRangeFilter, supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Supabase Realtime Subscription: actualiza automáticamente al confirmarse o revisarse un reporte
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime_reportes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes' },
        () => {
          // Debounce para evitar sobrecarga si entran varios cambios simultáneos
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            loadDashboardData();
          }, 800);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeActive(false);
        }
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Realtime Live Indicator */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        title={realtimeActive ? 'Conexión Realtime activa: actualización instantánea' : 'Actualización periódica'}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            realtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span className="hidden sm:inline">{realtimeActive ? 'Realtime activo' : 'Manual'}</span>
      </div>

      {/* Segmented Date Control */}
      <div
        role="group"
        aria-label="Rango de fechas"
        className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs"
      >
        {(
          [
            { id: 'hoy', label: 'Hoy' },
            { id: '7dias', label: '7 Días' },
            { id: '30dias', label: '30 Días' },
            { id: 'todo', label: 'Histórico' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            onClick={() => setDateRange(filter.id)}
            aria-pressed={dateRange === filter.id}
            className={`px-3 py-1.5 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              dateRange === filter.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        isLoading={refreshing}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        aria-label="Actualizar datos"
      >
        <span className="hidden sm:inline">Actualizar</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Content Header */}
      <ContentHeader
        title="Dashboard de Mantenimiento"
        subtitle="Supervisión en tiempo real de intervenciones reportadas desde Telegram"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Dashboard', active: true },
        ]}
        actions={headerActions}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Total Visibles"
              value={kpi?.total_reportes ?? '—'}
              subtitle="En período seleccionado"
              icon={FileText}
              variant="info"
              href="/reportes"
            />
            <KpiCard
              title="Por Revisar"
              value={kpi?.confirmados_por_revisar ?? 0}
              subtitle="Confirmados en Telegram"
              icon={Clock}
              variant={(kpi?.confirmados_por_revisar ?? 0) > 0 ? 'warning' : 'default'}
              href="/reportes?estado=confirmado"
            />
            <KpiCard
              title="Revisados"
              value={kpi?.revisados ?? 0}
              subtitle="Validados por supervisor"
              icon={CheckCircle2}
              variant="success"
              href="/reportes?estado=revisado"
            />
            <KpiCard
              title="Rechazados"
              value={kpi?.rechazados ?? 0}
              subtitle="Con observación enviada"
              icon={XCircle}
              variant={(kpi?.rechazados ?? 0) > 0 ? 'danger' : 'default'}
              href="/reportes?estado=rechazado"
            />
            <KpiCard
              title="Duración Media"
              value={formatMinutos(kpi?.duracion_promedio_min)}
              subtitle="En reportes con duración"
              icon={Timer}
              variant="primary"
            />
            <KpiCard
              title="Confianza IA"
              value={
                kpi?.confianza_promedio !== null && kpi?.confianza_promedio !== undefined
                  ? formatConfianza(kpi.confianza_promedio)
                  : 'Sin datos'
              }
              subtitle="Estimación orientativa"
              icon={Sparkles}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-80 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
        ) : (
          <DashboardCharts
            reportesPorDia={reportesPorDia}
            fallasPorEquipo={fallasPorEquipo}
            repuestosMasUsados={repuestosMasUsados}
            reportesPorTecnico={reportesPorTecnico}
            distribucionTipo={distribucionTipo}
            distribucionPrioridad={distribucionPrioridad}
            distribucionEstado={distribucionEstado}
          />
        )}
      </div>

      {/* Reportes Confirmados Esperando Revisión de Supervisión */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Reportes Confirmados Esperando Revisión</span>
              <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1">
                {reportesPendientes.length} pendientes
              </span>
            </CardTitle>
          </div>

          <Link
            href="/reportes?estado=confirmado"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded p-1"
          >
            <span>Ver todos los reportes por revisar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={4} cols={8} />
            </div>
          ) : reportesPendientes.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Al día: sin reportes pendientes de revisión"
              description="No hay intervenciones confirmadas por los técnicos que requieran revisión en este momento."
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10px] border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">N.º</th>
                      <th className="py-3 px-4">Fecha Registro</th>
                      <th className="py-3 px-4">Técnico</th>
                      <th className="py-3 px-4">Equipo y Tag</th>
                      <th className="py-3 px-4">Falla / Motivo</th>
                      <th className="py-3 px-4">Tipo y Prioridad</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Origen</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportesPendientes.map((r) => {
                      const demorado = isReporteDemorado(r.created_at, r.estado);
                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            demorado ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {formatReporteNumero(r.numero)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatFechaHoraLima(r.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                            {r.tecnico_nombre || 'Sin nombre'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {r.equipo || 'Sin equipo'}
                            </div>
                            {r.codigo_equipo && (
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {r.codigo_equipo}
                              </div>
                            )}
                          </td>
                          <td
                            className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300"
                            title={r.falla || ''}
                          >
                            {r.falla || (r.tipo_mantenimiento === 'preventivo' ? 'Mantenimiento preventivo programado' : '—')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <TipoBadge tipo={r.tipo_mantenimiento} />
                              <PrioridadBadge prioridad={r.prioridad} />
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <EstadoBadge estado={r.estado} isDemorado={demorado} />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <OrigenBadge origen={r.origen} duracionSeg={r.audio_duracion_seg} />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/reportes/${r.id}`}
                              className="btn-modern-primary text-xs px-2.5 py-1 focus-visible:ring-2"
                            >
                              <span>Revisar</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {reportesPendientes.map((r) => {
                  const demorado = isReporteDemorado(r.created_at, r.estado);
                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 ${
                        demorado ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/50' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {formatReporteNumero(r.numero)}
                        </span>
                        <EstadoBadge estado={r.estado} isDemorado={demorado} />
                      </div>

                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {r.equipo || 'Sin equipo especificado'}
                        </div>
                        {r.codigo_equipo && (
                          <div className="text-[11px] font-mono text-slate-500">
                            Tag: {r.codigo_equipo}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {r.falla || (r.tipo_mantenimiento === 'preventivo' ? 'Mantenimiento preventivo programado' : 'Sin descripción')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <TipoBadge tipo={r.tipo_mantenimiento} />
                        <PrioridadBadge prioridad={r.prioridad} />
                        <OrigenBadge origen={r.origen} duracionSeg={r.audio_duracion_seg} />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <span>{formatFechaHoraLima(r.created_at)}</span>
                        <Link
                          href={`/reportes/${r.id}`}
                          className="btn-modern-primary text-xs px-3 py-1.5"
                        >
                          <span>Revisar Reporte</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <CardFooter>
          <span>Intervenciones confirmadas por técnicos en Telegram que esperan validación de supervisión</span>
        </CardFooter>
      </Card>
    </div>
  );
}
