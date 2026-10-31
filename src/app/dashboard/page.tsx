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
import { ContentHeader } from '@/components/layout/ContentHeader';
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
  Cpu,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
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
        // Count distribution by tipo_mantenimiento
        const tipoMap: Record<string, number> = {};
        const prioMap: Record<string, number> = {};
        const estMap: Record<string, number> = {};

        reportesDist.forEach((r) => {
          const t = r.tipo_mantenimiento || 'Sin especificar';
          tipoMap[t] = (tipoMap[t] || 0) + 1;

          const p = r.prioridad || 'Sin prioridad';
          prioMap[p] = (prioMap[p] || 0) + 1;

          const e = r.estado || 'pendiente';
          estMap[e] = (estMap[e] || 0) + 1;
        });

        setDistribucionTipo(
          Object.entries(tipoMap).map(([name, value]) => ({ name, value }))
        );
        setDistribucionPrioridad(
          Object.entries(prioMap).map(([name, value]) => ({ name, value }))
        );
        setDistribucionEstado(
          Object.entries(estMap).map(([name, value]) => ({ name, value }))
        );
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Modern Segmented Date Control */}
      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs">
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
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateRange === filter.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
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
        className="btn-modern-default text-xs px-3 py-1.5"
        title="Actualizar datos"
        aria-label="Actualizar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
        <span className="hidden sm:inline">Actualizar</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Content Header */}
      <ContentHeader
        title="Dashboard de Mantenimiento"
        subtitle="Panel de supervisión operativa y estado de planta en tiempo real"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Dashboard', active: true },
        ]}
        actions={headerActions}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiCard
          title="Total Reportes"
          value={kpi?.total_reportes ?? '—'}
          subtitle={`${kpi?.confirmados ?? 0} validados y confirmados`}
          icon={FileText}
          variant="info"
          href="/reportes"
        />
        <KpiCard
          title="Por Revisar"
          value={kpi?.pendientes ?? '—'}
          subtitle={`${kpi?.rechazados ?? 0} rechazados`}
          icon={Clock}
          variant={(kpi?.pendientes ?? 0) > 0 ? 'warning' : 'default'}
          href="/reportes?estado=pendiente,corregido"
        />
        <KpiCard
          title="% Sin Corrección"
          value={
            kpi?.pct_sin_correccion !== null && kpi?.pct_sin_correccion !== undefined
              ? `${kpi.pct_sin_correccion}%`
              : '—'
          }
          subtitle="Precisión del técnico"
          icon={Sparkles}
          variant="success"
        />
        <KpiCard
          title="Duración Media"
          value={formatMinutos(kpi?.duracion_promedio_min)}
          subtitle="Tiempo de intervención"
          icon={Timer}
          variant="primary"
        />
        <KpiCard
          title="Tiempo IA"
          value={formatSegundos(kpi?.procesamiento_promedio_seg)}
          subtitle="Procesamiento inteligente IA"
          icon={Cpu}
          variant="purple"
        />
        <KpiCard
          title="Confianza IA"
          value={
            kpi?.confianza_promedio !== null && kpi?.confianza_promedio !== undefined
              ? formatConfianza(kpi.confianza_promedio)
              : '—'
          }
          subtitle="Certeza del modelo"
          icon={CheckCircle2}
          variant="default"
        />
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

      {/* Últimos 10 Reportes Pendientes */}
      <div className="modern-card">
        <div className="modern-card-header">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Reportes Pendientes de Revisión Prioritaria
            </span>
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {reportesPendientes.length} pendientes
            </span>
          </div>

          <Link
            href="/reportes?estado=pendiente,corregido"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos los pendientes</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={4} cols={8} />
            </div>
          ) : reportesPendientes.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Al día: sin reportes pendientes de revisión
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Todas las intervenciones reportadas han sido validadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4">N.º</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Técnico</th>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4">Falla Reportada</th>
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
                          {r.falla || '—'}
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
                            className="btn-modern-primary text-xs px-2.5 py-1"
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
        <div className="modern-card-footer">
          Se muestran los 10 reportes prioritarios recibidos recientemente desde Telegram
        </div>
      </div>
    </div>
  );
}
