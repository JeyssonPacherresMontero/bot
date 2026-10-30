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

      // Filter by missing fields
      if (filtros.soloFaltantes) {
        query = query.not('campos_faltantes', 'eq', '{}');
      }

      // Sorting
      query = query.order(sortColumn, { ascending: sortAsc });

      // Pagination
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

  // Realtime subscription for INSERT in reportes
  useEffect(() => {
    const channel = supabase
      .channel('realtime_reportes_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reportes' },
        (payload) => {
          const newRep = payload.new as Reporte;
          setNewReporteNotice(
            `Nuevo reporte recibido: #${formatReporteNumero(newRep.numero)} - ${newRep.equipo || 'Equipo'} (${newRep.tecnico_nombre || 'Técnico'})`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Sort handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
    setPage(1);
  };

  // Selection handlers
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
          className="btn-lte-primary text-xs"
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
        className="btn-lte-success text-xs"
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
        className="btn-lte-default text-xs"
        title="Recargar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#007bff]' : ''}`} />
        <span className="hidden sm:inline">Recargar</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Realtime Alert Banner */}
      {newReporteNotice && (
        <div className="p-3 rounded-[0.25rem] bg-[#28a745] text-white flex items-center justify-between shadow-lte border border-[#1e7e34]">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <BellRing className="w-4 h-4 text-[#ffc107] shrink-0" />
            <span>{newReporteNotice}</span>
          </div>
          <button
            onClick={() => {
              setNewReporteNotice(null);
              loadReportes();
            }}
            className="btn-lte bg-white text-[#155724] hover:bg-[#e9ecef] text-xs font-bold py-1 px-2.5 rounded-[0.2rem]"
          >
            Actualizar
          </button>
        </div>
      )}

      {/* Content Header AdminLTE */}
      <ContentHeader
        title="Registro de Reportes"
        subtitle={`${totalCount} reporte${totalCount === 1 ? '' : 's'} en total según los filtros aplicados.`}
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

      {/* Reports Table Card - AdminLTE Card Outline */}
      <div className="lte-card border-t-[3px] border-t-[#007bff]">
        <div className="lte-card-header">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
              Listado de Órdenes de Trabajo y Reportes
            </span>
            <span className="bg-[#007bff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
              Total: {totalCount}
            </span>
          </div>
          <span className="text-xs text-[#6c757d] dark:text-[#ced4da]">
            Página {page} de {totalPages}
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={9} />
            </div>
          ) : reportes.length === 0 ? (
            <div className="p-10 text-center text-[#6c757d] dark:text-[#adb5bd]">
              <AlertCircle className="w-8 h-8 text-[#ffc107] mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                No se encontraron reportes
              </h3>
              <p className="text-xs text-[#6c757d] dark:text-[#adb5bd] mt-0.5">
                Prueba cambiando o limpiando los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f6f9] dark:bg-[#2c3338] text-[#495057] dark:text-[#ced4da] font-semibold border-b border-[#dee2e6] dark:border-[#4b545c]">
                    <th className="py-2.5 px-3 w-8 border-r border-[#dee2e6] dark:border-[#4b545c] text-center">
                      <input
                        type="checkbox"
                        checked={
                          reportes.length > 0 && selectedIds.length === reportes.length
                        }
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 rounded text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
                      />
                    </th>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-[#e9ecef] dark:hover:bg-[#3f474e] border-r border-[#dee2e6] dark:border-[#4b545c]"
                      onClick={() => handleSort('numero')}
                    >
                      <div className="flex items-center gap-1">
                        <span>N.º</span>
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-[#e9ecef] dark:hover:bg-[#3f474e] border-r border-[#dee2e6] dark:border-[#4b545c]"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Fecha</span>
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Técnico
                    </th>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-[#e9ecef] dark:hover:bg-[#3f474e] border-r border-[#dee2e6] dark:border-[#4b545c]"
                      onClick={() => handleSort('equipo')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Equipo / Código</span>
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Falla
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Tipo
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Prioridad
                    </th>
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-[#e9ecef] dark:hover:bg-[#3f474e] border-r border-[#dee2e6] dark:border-[#4b545c]"
                      onClick={() => handleSort('estado')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Estado</span>
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Confianza
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Origen
                    </th>
                    <th className="py-2.5 px-3 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] dark:divide-[#4b545c]">
                  {reportes.map((r) => {
                    const demorado = isReporteDemorado(r.created_at, r.estado);
                    const isSelected = selectedIds.includes(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-[#e9ecef]/60 dark:hover:bg-[#3f474e]/50 transition-colors ${
                          demorado
                            ? 'bg-[#fff3cd]/50 dark:bg-[#ffc107]/10'
                            : isSelected
                            ? 'bg-[#e8f4fd] dark:bg-[#007bff]/15'
                            : 'even:bg-[#f8f9fa] dark:even:bg-[#2f353a]'
                        }`}
                      >
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c] text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(r.id)}
                            className="w-3.5 h-3.5 rounded text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
                          />
                        </td>
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
                          <TipoBadge tipo={r.tipo_mantenimiento} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <PrioridadBadge prioridad={r.prioridad} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <EstadoBadge estado={r.estado} isDemorado={demorado} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <span className="font-medium text-[#495057] dark:text-[#ced4da]">
                            {formatConfianza(r.confianza)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <OrigenBadge
                            origen={r.origen}
                            duracionSeg={r.audio_duracion_seg}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <Link
                            href={`/reportes/${r.id}`}
                            className="btn-lte-primary text-xs px-2.5 py-1"
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
        <div className="lte-card-footer flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#6c757d] dark:text-[#ced4da]">
            Mostrando página{' '}
            <span className="font-bold text-[#212529] dark:text-[#f8f9fa]">{page}</span> de{' '}
            <span className="font-bold text-[#212529] dark:text-[#f8f9fa]">{totalPages}</span> (
            {totalCount} reportes en total)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-lte-default text-xs px-2.5 py-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <span className="px-2 py-1 bg-[#007bff] text-white text-xs font-bold rounded-[0.25rem]">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-lte-default text-xs px-2.5 py-1"
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
