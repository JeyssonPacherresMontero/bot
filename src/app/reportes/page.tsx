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
  Download,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  BellRing,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const PAGE_SIZE = 25;

function ReportesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  // Parse initial query params (e.g. from dashboard ?estado=pendiente,corregido)
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

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);

  // Realtime notification banner
  const [newReporteNotice, setNewReporteNotice] = useState<string | null>(null);

  // Fetch reportes
  const loadReportes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('reportes').select('*', { count: 'exact' });

      // Search text across multiple columns (ilike or or())
      if (filtros.busqueda.trim()) {
        const term = filtros.busqueda.trim();
        query = query.or(
          `equipo.ilike.%${term}%,codigo_equipo.ilike.%${term}%,falla.ilike.%${term}%,tecnico_nombre.ilike.%${term}%,numero_ot.ilike.%${term}%,texto_original.ilike.%${term}%`
        );
      }

      // Filter by status (multi)
      if (filtros.estados.length > 0) {
        query = query.in('estado', filtros.estados);
      }

      // Filter by priority
      if (filtros.prioridad) {
        query = query.eq('prioridad', filtros.prioridad);
      }

      // Filter by maintenance type
      if (filtros.tipo) {
        query = query.eq('tipo_mantenimiento', filtros.tipo);
      }

      // Filter by origin
      if (filtros.origen) {
        query = query.eq('origen', filtros.origen);
      }

      // Filter by date range
      if (filtros.fechaDesde) {
        query = query.gte('created_at', `${filtros.fechaDesde}T00:00:00Z`);
      }
      if (filtros.fechaHasta) {
        query = query.lte('created_at', `${filtros.fechaHasta}T23:59:59Z`);
      }

      // Filter by missing fields (campos_faltantes not empty array)
      if (filtros.soloFaltantes) {
        query = query.not('campos_faltantes', 'eq', '{}');
      }

      // Sorting
      query = query.order(sortColumn, { ascending: sortAsc });

      // Server Pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching reportes:', error);
      } else {
        setReportes((data as Reporte[]) || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error in loadReportes:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filtros, page, sortColumn, sortAsc]);

  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:reportes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reportes' },
        (payload) => {
          const newRow = payload.new as Reporte;
          setNewReporteNotice(
            `¡Nuevo reporte ingresado vía Telegram (${newRow.equipo || 'Sin equipo'})! Haz clic para actualizar.`
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reportes' },
        () => {
          loadReportes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadReportes]);

  // Toggle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
    setPage(1);
  };

  // Checkbox selection
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

  // Batch validate selected
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

  // Export filtered to CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch all matching records without pagination limit
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

  return (
    <div className="space-y-6">
      {/* Realtime Alert Banner */}
      {newReporteNotice && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-bounce">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-sm font-semibold">{newReporteNotice}</span>
          </div>
          <button
            onClick={() => {
              setNewReporteNotice(null);
              loadReportes();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 hover:bg-slate-100 transition-colors"
          >
            Actualizar tabla
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Registro de Reportes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalCount} reporte{totalCount === 1 ? '' : 's'} en total según los filtros aplicados.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchValidate}
              disabled={batchLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              {batchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>Validar {selectedIds.length} seleccionados</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={exporting || totalCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => loadReportes()}
            disabled={loading}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={9} />
          </div>
        ) : reportes.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No se encontraron reportes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Prueba cambiando o limpiando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        reportes.length > 0 && selectedIds.length === reportes.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                    />
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                    onClick={() => handleSort('numero')}
                  >
                    <div className="flex items-center gap-1">
                      <span>N.º</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Técnico</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                    onClick={() => handleSort('equipo')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Equipo / Código</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Falla</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Prioridad</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                    onClick={() => handleSort('estado')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Estado</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Confianza</th>
                  <th className="py-3 px-3">Origen</th>
                  <th className="py-3 px-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportes.map((r) => {
                  const demorado = isReporteDemorado(r.created_at, r.estado);
                  const isSelected = selectedIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        demorado ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                      } ${isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/30' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(r.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                        />
                      </td>
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
                      <td
                        className="py-3 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300"
                        title={r.falla || ''}
                      >
                        {r.falla || '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <TipoBadge tipo={r.tipo_mantenimiento} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <PrioridadBadge prioridad={r.prioridad} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <EstadoBadge estado={r.estado} isDemorado={demorado} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatConfianza(r.confianza)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <OrigenBadge
                          origen={r.origen}
                          duracionSeg={r.audio_duracion_seg}
                        />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/reportes/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs"
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

        {/* Server Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Mostrando página{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> de{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> (
            {totalCount} reportes)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
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
