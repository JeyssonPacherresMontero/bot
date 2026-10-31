'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { FiltrosReportes, type FiltrosReportesState } from '@/components/reportes/FiltrosReportes';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { exportReportesToCSV } from '@/lib/export-csv';
import {
  formatReporteNumero,
  formatFechaHoraLima,
  isReporteDemorado,
  formatConfianza,
} from '@/lib/utils';
import type { Reporte, EstadoReporte } from '@/types/database.types';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  BellRing,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

const PAGE_SIZE = 25;

function ReportesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const initialEstadoParam = searchParams.get('estado');
  const initialEstados: EstadoReporte[] = initialEstadoParam
    ? (initialEstadoParam.split(',') as EstadoReporte[])
    : [];

  const [filtros, setFiltros] = useState<FiltrosReportesState>({
    busqueda: searchParams.get('q') || '',
    estados: initialEstados,
    prioridad: '',
    tipo: '',
    origen: '',
    soloFaltantes: false,
    fechaDesde: '',
    fechaHasta: '',
  });

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);

  const [newReporteNotice, setNewReporteNotice] = useState<string | null>(null);

  const loadReportes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('reportes').select('*', { count: 'exact' });

      if (filtros.busqueda.trim()) {
        const term = filtros.busqueda.trim();
        query = query.or(
          `equipo.ilike.%${term}%,codigo_equipo.ilike.%${term}%,falla.ilike.%${term}%,tecnico_nombre.ilike.%${term}%,numero_ot.ilike.%${term}%,texto_original.ilike.%${term}%`
        );
      }

      if (filtros.estados.length > 0) {
        query = query.in('estado', filtros.estados);
      }

      if (filtros.prioridad) {
        query = query.eq('prioridad', filtros.prioridad);
      }

      if (filtros.tipo) {
        query = query.eq('tipo_mantenimiento', filtros.tipo);
      }

      if (filtros.origen) {
        query = query.eq('origen', filtros.origen);
      }

      if (filtros.fechaDesde) {
        query = query.gte('created_at', `${filtros.fechaDesde}T00:00:00Z`);
      }
      if (filtros.fechaHasta) {
        query = query.lte('created_at', `${filtros.fechaHasta}T23:59:59Z`);
      }

      if (filtros.soloFaltantes) {
        query = query.not('campos_faltantes', 'eq', '{}');
      }

      query = query.order(sortColumn, { ascending: sortAsc });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error al cargar reportes:', error);
      } else {
        setReportes((data as Reporte[]) || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error general cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, page, sortColumn, sortAsc, supabase]);

  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime_reportes_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reportes' },
        (payload) => {
          const newRep = payload.new as Reporte;
          setNewReporteNotice(
            `Nuevo reporte recibido: #${formatReporteNumero(newRep.numero)} · ${newRep.equipo || 'Equipo'} · ${newRep.tecnico_nombre || 'Técnico'}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
    setPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reportes.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchValidate = async () => {
    if (selectedIds.length === 0) return;
    const confirmVal = confirm(
      `¿Deseas validar y marcar como 'Revisado' los ${selectedIds.length} reportes seleccionados?`
    );
    if (!confirmVal) return;

    setBatchLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'revisado',
          revisado_por: user?.id || null,
          revisado_en: nowIso,
          comentario_supervisor: 'Validación en lote por supervisor.',
        })
        .in('id', selectedIds);

      if (error) {
        alert(`Error al validar en lote: ${error.message}`);
      } else {
        setSelectedIds([]);
        loadReportes();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let query = supabase.from('reportes').select('*');

      if (filtros.busqueda.trim()) {
        const term = filtros.busqueda.trim();
        query = query.or(
          `equipo.ilike.%${term}%,codigo_equipo.ilike.%${term}%,falla.ilike.%${term}%,tecnico_nombre.ilike.%${term}%,numero_ot.ilike.%${term}%,texto_original.ilike.%${term}%`
        );
      }
      if (filtros.estados.length > 0) query = query.in('estado', filtros.estados);
      if (filtros.prioridad) query = query.eq('prioridad', filtros.prioridad);
      if (filtros.tipo) query = query.eq('tipo_mantenimiento', filtros.tipo);
      if (filtros.origen) query = query.eq('origen', filtros.origen);
      if (filtros.fechaDesde) query = query.gte('created_at', `${filtros.fechaDesde}T00:00:00Z`);
      if (filtros.fechaHasta) query = query.lte('created_at', `${filtros.fechaHasta}T23:59:59Z`);
      if (filtros.soloFaltantes) query = query.not('campos_faltantes', 'eq', '{}');

      query = query.order(sortColumn, { ascending: sortAsc }).limit(5000);

      const { data, error } = await query;
      if (error) {
        alert(`Error al exportar: ${error.message}`);
      } else if (data) {
        exportReportesToCSV(
          data as Reporte[],
          `reportes_maintai_${new Date().toISOString().slice(0, 10)}.csv`
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error al exportar CSV: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const actions = (
    <div className="flex items-center gap-2">
      {selectedIds.length > 0 && (
        <button
          onClick={handleBatchValidate}
          disabled={batchLoading}
          className="btn-modern-primary text-xs"
        >
          {batchLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCheck className="w-3.5 h-3.5" />
          )}
          <span>Validar {selectedIds.length}</span>
        </button>
      )}

      <button
        onClick={handleExportCSV}
        disabled={exporting || totalCount === 0}
        className="btn-modern-success text-xs"
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        <span>Exportar CSV</span>
      </button>

      <button
        onClick={() => loadReportes()}
        disabled={loading}
        className="btn-modern-default text-xs"
        title="Recargar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        <span className="hidden sm:inline">Recargar</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Realtime Alert Banner */}
      {newReporteNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-between border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{newReporteNotice}</span>
          </div>
          <button
            onClick={() => {
              setNewReporteNotice(null);
              loadReportes();
            }}
            className="btn-modern bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-3"
          >
            Actualizar lista
          </button>
        </div>
      )}

      {/* Content Header */}
      <ContentHeader
        title="Registro de Reportes"
        subtitle={`${totalCount} reporte${totalCount === 1 ? '' : 's'} registrados según los criterios activos`}
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Reportes', active: true },
        ]}
        actions={actions}
      />

      {/* Filters component */}
      <FiltrosReportes
        filtros={filtros}
        onChange={(n) => {
          setFiltros(n);
          setPage(1);
        }}
        onLimpiar={() => {
          setFiltros({
            busqueda: '',
            estados: [],
            prioridad: '',
            tipo: '',
            origen: '',
            soloFaltantes: false,
            fechaDesde: '',
            fechaHasta: '',
          });
          setPage(1);
        }}
      />

      {/* Reports Table Card */}
      <div className="modern-card">
        <div className="modern-card-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Listado de Órdenes de Trabajo y Reportes
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
              Total: {totalCount}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Página {page} de {totalPages}
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={9} />
            </div>
          ) : reportes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                No se encontraron reportes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prueba cambiando o limpiando los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          reportes.length > 0 && selectedIds.length === reportes.length
                        }
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                      />
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800"
                      onClick={() => handleSort('numero')}
                    >
                      <div className="flex items-center gap-1">
                        <span>N.º</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Fecha</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      Técnico
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800"
                      onClick={() => handleSort('equipo')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Equipo e Identificador</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      Falla
                    </th>
                    <th className="py-3 px-4">
                      Tipo
                    </th>
                    <th className="py-3 px-4">
                      Prioridad
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800"
                      onClick={() => handleSort('estado')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Estado</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      Confianza
                    </th>
                    <th className="py-3 px-4">
                      Origen
                    </th>
                    <th className="py-3 px-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportes.map((r) => {
                    const demorado = isReporteDemorado(r.created_at, r.estado);
                    const isSelected = selectedIds.includes(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          demorado
                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                            : isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/30'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(r.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                          />
                        </td>
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
                          <TipoBadge tipo={r.tipo_mantenimiento} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <PrioridadBadge prioridad={r.prioridad} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <EstadoBadge estado={r.estado} isDemorado={demorado} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatConfianza(r.confianza)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <OrigenBadge
                            origen={r.origen}
                            duracionSeg={r.audio_duracion_seg}
                          />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/reportes/${r.id}`}
                            className="btn-modern-primary text-xs px-2.5 py-1"
                          >
                            <span>Ver</span>
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

        {/* Server Pagination Footer */}
        <div className="modern-card-footer flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando página{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> de{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> ·{' '}
            {totalCount} reportes en total
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-modern-default text-xs px-3 py-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-modern-default text-xs px-3 py-1.5"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={9} />}>
      <ReportesContent />
    </Suspense>
  );
}
