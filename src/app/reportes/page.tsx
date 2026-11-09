'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
import { OrigenBadge } from '@/components/badges/OrigenBadge';
import { FiltrosReportes, type FiltrosReportesState } from '@/components/reportes/FiltrosReportes';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
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
  FileSpreadsheet,
} from 'lucide-react';

const PAGE_SIZE = 25;

function ReportesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const supabase = createClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
  const [showBatchConfirm, setShowBatchConfirm] = useState<boolean>(false);

  const [newReporteNotice, setNewReporteNotice] = useState<string | null>(null);

  const loadReportes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('reportes').select('*', { count: 'exact' });

      if (filtros.busqueda.trim()) {
        const term = filtros.busqueda.trim();
        query = query.or(
          `equipo.ilike.%${term}%,codigo_equipo.ilike.%${term}%,area.ilike.%${term}%,falla.ilike.%${term}%,tecnico_nombre.ilike.%${term}%,numero_ot.ilike.%${term}%,texto_original.ilike.%${term}%`
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
        toast.error('Error al cargar la lista de reportes', error.message);
      } else {
        setReportes((data as Reporte[]) || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error general cargando reportes:', err);
      toast.error('Error de conexión al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [filtros, page, sortColumn, sortAsc, supabase, toast]);

  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  // Supabase Realtime: escucha tanto INSERT como UPDATE (por ejemplo cuando pasa de borrador a confirmado o cuando se valida)
  useEffect(() => {
    const channel = supabase
      .channel('realtime_reportes_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes' },
        (payload) => {
          const rec = (payload.new || payload.old) as Reporte;
          if (payload.eventType === 'INSERT') {
            setNewReporteNotice(
              `Nuevo reporte registrado: #${formatReporteNumero(rec?.numero)} · ${rec?.equipo || 'Equipo'} · ${rec?.tecnico_nombre || 'Técnico'}`
            );
          } else if (payload.eventType === 'UPDATE') {
            const estadoTexto = rec?.estado === 'confirmado' ? 'Confirmado por técnico' : rec?.estado;
            setNewReporteNotice(
              `Reporte #${formatReporteNumero(rec?.numero)} actualizado (${estadoTexto})`
            );
          }

          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            loadReportes();
          }, 800);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, loadReportes]);

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
    setBatchLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('reportes')
        .update({
          estado: 'revisado',
          revisado_por: user?.id || null,
          revisado_en: nowIso,
          comentario_supervisor: 'Validación técnica en lote por supervisor.',
        })
        .in('id', selectedIds);

      if (error) {
        toast.error('Error al validar en lote', error.message);
      } else {
        toast.success(
          'Validación en lote exitosa',
          `Se marcaron ${selectedIds.length} reporte(s) como revisados.`
        );
        setSelectedIds([]);
        setShowBatchConfirm(false);
        loadReportes();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
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
          `equipo.ilike.%${term}%,codigo_equipo.ilike.%${term}%,area.ilike.%${term}%,falla.ilike.%${term}%,tecnico_nombre.ilike.%${term}%,numero_ot.ilike.%${term}%,texto_original.ilike.%${term}%`
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
        toast.error('Error al exportar datos', error.message);
      } else if (data) {
        exportReportesToCSV(
          data as Reporte[],
          `reportes_maintai_${new Date().toISOString().slice(0, 10)}.csv`
        );
        toast.success('Archivo CSV exportado exitosamente');
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error al exportar CSV', error.message);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {selectedIds.length > 0 && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowBatchConfirm(true)}
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
        >
          <span>Validar ({selectedIds.length})</span>
        </Button>
      )}

      <Button
        variant="success"
        size="sm"
        onClick={handleExportCSV}
        isLoading={exporting}
        disabled={totalCount === 0}
        leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
      >
        <span>Exportar CSV</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => loadReportes()}
        isLoading={loading}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        aria-label="Recargar listado"
      >
        <span className="hidden sm:inline">Recargar</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Realtime Alert Banner */}
      {newReporteNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-3 border border-blue-200 dark:border-blue-800/60 shadow-xs animate-slide-in-up"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <BellRing className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{newReporteNotice}</span>
          </div>
          <Button
            size="xs"
            variant="primary"
            onClick={() => {
              setNewReporteNotice(null);
              loadReportes();
            }}
          >
            Actualizar lista
          </Button>
        </div>
      )}

      {/* Content Header */}
      <ContentHeader
        title="Registro de Reportes de Mantenimiento"
        subtitle={`${totalCount} reporte${totalCount === 1 ? '' : 's'} visibles según los filtros aplicados`}
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>
              <span>Listado de Intervenciones y Reportes</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                Total: {totalCount}
              </span>
            </CardTitle>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Página {page} de {totalPages}
          </span>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={9} />
            </div>
          ) : reportes.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No se encontraron reportes"
              description="No hay intervenciones que coincidan con los criterios activos. Prueba modificando o limpiando los filtros."
              actionLabel="Limpiar filtros"
              onAction={() => {
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
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4 w-8 text-center">
                        <input
                          type="checkbox"
                          aria-label="Seleccionar todos los reportes de la página"
                          checked={
                            reportes.length > 0 && selectedIds.length === reportes.length
                          }
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                        />
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('numero')}
                      >
                        <div className="flex items-center gap-1">
                          <span>N.º</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Fecha Registro</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Técnico</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('equipo')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Equipo, Tag y Área</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Falla / Motivo</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Prioridad</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleSort('estado')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Estado</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4" title="Confianza orientativa calculada por IA">Confianza</th>
                      <th className="py-3 px-4">Origen</th>
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
                              aria-label={`Seleccionar reporte ${formatReporteNumero(r.numero)}`}
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
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {r.codigo_equipo && <span>Tag: {r.codigo_equipo}</span>}
                              {r.area && <span className="text-slate-400 font-sans">· {r.area}</span>}
                            </div>
                          </td>
                          <td
                            className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300"
                            title={r.falla || ''}
                          >
                            {r.falla || (r.tipo_mantenimiento === 'preventivo' ? 'Mantenimiento preventivo programado' : '—')}
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
                            <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]" title="Certeza orientativa">
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
                              className="btn-modern-primary text-xs px-2.5 py-1 focus-visible:ring-2"
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

              {/* Mobile Card List (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {reportes.map((r) => {
                  const demorado = isReporteDemorado(r.created_at, r.estado);
                  const isSelected = selectedIds.includes(r.id);

                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 ${
                        demorado
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/50'
                          : isSelected
                          ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300'
                          : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(r.id)}
                            aria-label={`Seleccionar reporte ${formatReporteNumero(r.numero)}`}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                          />
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {formatReporteNumero(r.numero)}
                          </span>
                        </div>
                        <EstadoBadge estado={r.estado} isDemorado={demorado} />
                      </div>

                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {r.equipo || 'Sin equipo especificado'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {r.codigo_equipo && <span className="font-mono">Tag: {r.codigo_equipo}</span>}
                          {r.area && <span>· {r.area}</span>}
                        </div>
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
                        <span className="truncate max-w-[150px]">
                          {r.tecnico_nombre || 'Técnico'} · {formatFechaHoraLima(r.created_at)}
                        </span>
                        <Link
                          href={`/reportes/${r.id}`}
                          className="btn-modern-primary text-xs px-3 py-1.5"
                        >
                          <span>Ver Ficha</span>
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

        {/* Server Pagination Footer */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando página{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> de{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> ·{' '}
            {totalCount} reportes en total
          </p>

          <div className="flex items-center gap-1.5" role="navigation" aria-label="Paginación de resultados">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              aria-label="Página anterior"
            >
              Anterior
            </Button>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs">
              {page}
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              aria-label="Página siguiente"
            >
              Siguiente
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Batch Validation Accessible Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={handleBatchValidate}
        title="Validación Técnica en Lote"
        message={`¿Estás seguro de que deseas marcar como 'Revisados' los ${selectedIds.length} reportes seleccionados? Se registrará tu usuario como supervisor de revisión y se conservará el historial.`}
        confirmLabel={`Validar ${selectedIds.length} Reportes`}
        variant="primary"
        isLoading={batchLoading}
      />
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
