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
  Zap,
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
      {/* AdminLTE button group */}
      <div className="inline-flex rounded-[0.25rem] shadow-xs border border-[#ced4da] dark:border-[#4b545c] bg-white dark:bg-[#343a40] overflow-hidden text-xs">
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
            className={`px-3 py-1.5 font-medium transition-colors border-r last:border-r-0 border-[#dee2e6] dark:border-[#4b545c] ${
              dateRange === filter.id
                ? 'bg-[#007bff] text-white font-semibold'
                : 'text-[#495057] dark:text-[#ced4da] hover:bg-[#e9ecef] dark:hover:bg-[#4b545c]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="btn-lte-default text-xs px-2.5 py-1.5"
        title="Actualizar datos"
        aria-label="Actualizar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#007bff]' : ''}`} />
        <span className="hidden sm:inline">Refrescar</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
      <ContentHeader
        title="Dashboard"
        subtitle="Panel de Control y Supervisión Operativa en Tiempo Real"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Dashboard', active: true },
        ]}
        actions={headerActions}
      />

      {/* AdminLTE Small Boxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          title="Total Reportes"
          value={kpi?.total_reportes ?? '—'}
          subtitle={`${kpi?.confirmados ?? 0} validados / confirmados`}
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
          subtitle="Whisper + Extracción"
          icon={Zap}
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
          <div className="h-80 rounded-[0.25rem] bg-[#e9ecef] dark:bg-[#343a40] animate-pulse" />
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

      {/* Últimos 10 Reportes Pendientes - AdminLTE Card Outline */}
      <div className="lte-card border-t-[3px] border-t-[#dc3545]">
        <div className="lte-card-header">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#dc3545]" />
            <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
              Reportes Pendientes de Revisión Prioritaria
            </span>
            <span className="bg-[#dc3545] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
              {reportesPendientes.length}
            </span>
          </div>

          <Link
            href="/reportes?estado=pendiente,corregido"
            className="text-xs font-semibold text-[#007bff] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos los pendientes</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={4} cols={8} />
            </div>
          ) : reportesPendientes.length === 0 ? (
            <div className="py-10 text-center text-[#6c757d] dark:text-[#adb5bd]">
              <Clock className="w-8 h-8 text-[#28a745] mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-[#212529] dark:text-[#f8f9fa]">
                ¡Al día! No hay reportes pendientes de revisión.
              </p>
              <p className="text-xs text-[#6c757d] dark:text-[#adb5bd] mt-0.5">
                Todas las intervenciones reportadas han sido validadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f6f9] dark:bg-[#2c3338] text-[#495057] dark:text-[#ced4da] font-semibold border-b border-[#dee2e6] dark:border-[#4b545c]">
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">N.º</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Fecha</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Técnico</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Equipo</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Falla Reportada</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Tipo / Prioridad</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Estado</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Origen</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] dark:divide-[#4b545c]">
                  {reportesPendientes.map((r) => {
                    const demorado = isReporteDemorado(r.created_at, r.estado);
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-[#e9ecef]/60 dark:hover:bg-[#3f474e]/50 transition-colors ${
                          demorado ? 'bg-[#fff3cd]/50 dark:bg-[#ffc107]/10' : 'even:bg-[#f8f9fa] dark:even:bg-[#2f353a]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#007bff] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {formatReporteNumero(r.numero)}
                        </td>
                        <td className="py-2.5 px-3 text-[#495057] dark:text-[#ced4da] whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {formatFechaHoraLima(r.created_at)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#212529] dark:text-[#f8f9fa] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {r.tecnico_nombre || 'Sin nombre'}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <div className="font-semibold text-[#212529] dark:text-[#f8f9fa]">
                            {r.equipo || 'Sin equipo'}
                          </div>
                          {r.codigo_equipo && (
                            <div className="text-[10px] font-mono text-[#6c757d] dark:text-[#adb5bd]">
                              {r.codigo_equipo}
                            </div>
                          )}
                        </td>
                        <td
                          className="py-2.5 px-3 max-w-xs truncate text-[#495057] dark:text-[#ced4da] border-r border-[#dee2e6] dark:border-[#4b545c]"
                          title={r.falla || ''}
                        >
                          {r.falla || '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <div className="flex items-center gap-1">
                            <TipoBadge tipo={r.tipo_mantenimiento} />
                            <PrioridadBadge prioridad={r.prioridad} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <EstadoBadge estado={r.estado} isDemorado={demorado} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <OrigenBadge origen={r.origen} duracionSeg={r.audio_duracion_seg} />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <Link
                            href={`/reportes/${r.id}`}
                            className="btn-lte-primary text-xs px-2.5 py-1"
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
        <div className="lte-card-footer">
          Se muestran los 10 reportes prioritarios recibidos recientemente desde Telegram
        </div>
      </div>
    </div>
  );
}
