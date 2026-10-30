'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  formatReporteNumero,
  formatFechaHoraLima,
  isReporteDemorado,
  formatMinutos,
  formatSegundos,
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
  Zap,
  ExternalLink,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<'hoy' | '7dias' | '30dias' | 'todo'>('30dias');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch KPI from v_kpi_resumen
      const { data: kpiData } = await supabase.from('v_kpi_resumen').select('*').single();
      if (kpiData) {
        setKpi(kpiData as VKpiResumen);
      }

      // 2. Fetch views
      const [
        { data: rPorDia },
        { data: fPorEquipo },
        { data: repMasUsados },
        { data: rPorTecnico },
        { data: ultimosPendientes },
      ] = await Promise.all([
        supabase.from('v_reportes_por_dia').select('*').limit(30),
        supabase.from('v_fallas_por_equipo').select('*').limit(10),
        supabase.from('v_repuestos_mas_usados').select('*').limit(10),
        supabase.from('v_reportes_por_tecnico').select('*').limit(10),
        supabase
          .from('reportes')
          .select('*')
          .in('estado', ['pendiente', 'corregido'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (rPorDia) setReportesPorDia(rPorDia as VReportesPorDia[]);
      if (fPorEquipo) setFallasPorEquipo(fPorEquipo as VFallasPorEquipo[]);
      if (repMasUsados) setRepuestosMasUsados(repMasUsados as VRepuestosMasUsados[]);
      if (rPorTecnico) setReportesPorTecnico(rPorTecnico as VReportesPorTecnico[]);
      if (ultimosPendientes) setReportesPendientes(ultimosPendientes as Reporte[]);

      // 3. Fetch distributions from reportes based on dateRange
      let query = supabase.from('reportes').select('tipo_mantenimiento, prioridad, estado, created_at');

      const now = new Date();
      if (dateRange === 'hoy') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('created_at', startOfDay);
      } else if (dateRange === '7dias') {
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past);
      } else if (dateRange === '30dias') {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past);
      }

      const { data: reportesDist } = await query;

      if (reportesDist) {
        // Tipos
        const tipoMap: Record<string, number> = {};
        const prioridadMap: Record<string, number> = {};
        const estadoMap: Record<string, number> = {};

        reportesDist.forEach((r) => {
          const t = r.tipo_mantenimiento || 'otro';
          tipoMap[t] = (tipoMap[t] || 0) + 1;

          const p = r.prioridad || 'sin definir';
          prioridadMap[p] = (prioridadMap[p] || 0) + 1;

          const e = r.estado || 'pendiente';
          estadoMap[e] = (estadoMap[e] || 0) + 1;
        });

        setDistribucionTipo(Object.entries(tipoMap).map(([name, value]) => ({ name, value })));
        setDistribucionPrioridad(Object.entries(prioridadMap).map(([name, value]) => ({ name, value })));
        setDistribucionEstado(Object.entries(estadoMap).map(([name, value]) => ({ name, value })));
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Panel de Supervisión
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              En Vivo
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Indicadores clave de rendimiento (KPI) e informes de la central de cogeneración.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
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
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateRange === filter.id
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Actualizar datos"
            aria-label="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Reportes"
          value={kpi?.total_reportes ?? '—'}
          subtitle={`${kpi?.confirmados ?? 0} validados/confirmados`}
          icon={FileText}
          variant="info"
        />
        <KpiCard
          title="Por Revisar"
          value={kpi?.pendientes ?? '—'}
          subtitle={`${kpi?.rechazados ?? 0} rechazados`}
          icon={Clock}
          variant={(kpi?.pendientes ?? 0) > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="% Sin Corrección"
          value={kpi?.pct_sin_correccion !== null && kpi?.pct_sin_correccion !== undefined ? `${kpi.pct_sin_correccion}%` : '—'}
          subtitle="Precisión del técnico"
          icon={Sparkles}
          variant="success"
        />
        <KpiCard
          title="Duración Media"
          value={formatMinutos(kpi?.duracion_promedio_min)}
          subtitle="Tiempo de intervención"
          icon={Timer}
          variant="default"
        />
        <KpiCard
          title="Tiempo IA"
          value={formatSegundos(kpi?.procesamiento_promedio_seg)}
          subtitle="Whisper + Extracción"
          icon={Zap}
          variant="purple"
        />
        <KpiCard
          title="Confianza IA"
          value={kpi?.confianza_promedio !== null && kpi?.confianza_promedio !== undefined ? formatConfianza(kpi.confianza_promedio) : '—'}
          subtitle="Certeza global"
          icon={Sparkles}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Análisis Gráfico Operativo
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtro actual: {dateRange === 'hoy' ? 'Hoy' : dateRange === '7dias' ? 'Últimos 7 días' : dateRange === '30dias' ? 'Últimos 30 días' : 'Histórico completo'}
          </span>
        </div>

        {loading ? (
          <div className="h-96 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
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

      {/* Últimos 10 Reportes Pendientes */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Últimos Reportes Pendientes de Revisión
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reportes generados por los técnicos que esperan validación o corrección del supervisor
            </p>
          </div>
          <Link
            href="/reportes?estado=pendiente,corregido"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            Ver todos los pendientes
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : reportesPendientes.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Clock className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ¡Al día! No hay reportes pendientes de revisión.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Todos los reportes enviados han sido validados o rechazados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">N.º</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-3">Equipo</th>
                  <th className="py-3 px-3">Falla Reportada</th>
                  <th className="py-3 px-3">Tipo / Prioridad</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Origen</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {reportesPendientes.map((r) => {
                  const demorado = isReporteDemorado(r.created_at, r.estado);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        demorado ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatReporteNumero(r.numero)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatFechaHoraLima(r.created_at)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {r.tecnico_nombre || 'Sin nombre'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {r.equipo || 'Sin equipo'}
                        </div>
                        {r.codigo_equipo && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {r.codigo_equipo}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300" title={r.falla || ''}>
                        {r.falla || '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <TipoBadge tipo={r.tipo_mantenimiento} />
                          <PrioridadBadge prioridad={r.prioridad} />
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <EstadoBadge estado={r.estado} isDemorado={demorado} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <OrigenBadge origen={r.origen} duracionSeg={r.audio_duracion_seg} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/reportes/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
