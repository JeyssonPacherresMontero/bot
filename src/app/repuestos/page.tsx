'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { formatFechaHoraLima, formatUnidadesRepuesto } from '@/lib/utils';
import type { Reporte, RepuestoConsolidado } from '@/types/database.types';
import { Package, Search, RefreshCw, X, Info } from 'lucide-react';

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<RepuestoConsolidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCantidad, setFilterCantidad] = useState<'todos' | 'con_cantidad' | 'sin_cantidad'>('todos');
  const supabase = createClient();

  const loadRepuestos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reportes')
        .select('id, numero, equipo, codigo_equipo, repuestos, created_at, estado')
        .in('estado', ['confirmado', 'revisado', 'rechazado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando repuestos:', error);
      } else {
        const reportes = (data as Reporte[]) || [];

        // Consolidación de repuestos desde arrays JSON
        const map: Record<string, {
          nombre: string;
          codigos: Set<string>;
          total_menciones: number;
          unidades_totales: number;
          tiene_cantidad_informada: boolean;
          equipos: Set<string>;
          ultimo_uso: string;
        }> = {};

        reportes.forEach((r) => {
          (r.repuestos || []).forEach((rep) => {
            if (rep?.nombre && rep.nombre.trim()) {
              const nombreNorm = rep.nombre.trim();
              const key = nombreNorm.toLowerCase();

              const prev = map[key] || {
                nombre: nombreNorm,
                codigos: new Set<string>(),
                total_menciones: 0,
                unidades_totales: 0,
                tiene_cantidad_informada: false,
                equipos: new Set<string>(),
                ultimo_uso: r.created_at,
              };

              prev.total_menciones += 1;

              if (rep.codigo && rep.codigo.trim()) {
                prev.codigos.add(rep.codigo.trim());
              }

              if (rep.cantidad !== null && rep.cantidad !== undefined && !isNaN(Number(rep.cantidad))) {
                prev.unidades_totales += Number(rep.cantidad);
                prev.tiene_cantidad_informada = true;
              }

              const eqLabel = r.codigo_equipo || r.equipo;
              if (eqLabel) {
                prev.equipos.add(eqLabel);
              }

              if (new Date(r.created_at) > new Date(prev.ultimo_uso)) {
                prev.ultimo_uso = r.created_at;
              }

              map[key] = prev;
            }
          });
        });

        const lista: RepuestoConsolidado[] = Object.values(map).map((item) => ({
          nombre: item.nombre,
          codigo: item.codigos.size > 0 ? Array.from(item.codigos).join(', ') : null,
          total_menciones: item.total_menciones,
          unidades_totales: item.tiene_cantidad_informada ? item.unidades_totales : null,
          tiene_cantidad_informada: item.tiene_cantidad_informada,
          equipos_utilizados: Array.from(item.equipos),
          ultimo_uso: item.ultimo_uso,
        }));

        lista.sort((a, b) => b.total_menciones - a.total_menciones);
        setRepuestos(lista);
      }
    } catch (err) {
      console.error('Error cargando repuestos:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadRepuestos();
  }, [loadRepuestos]);

  const filteredRepuestos = repuestos.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      (item.nombre || '').toLowerCase().includes(q) ||
      (item.codigo || '').toLowerCase().includes(q) ||
      item.equipos_utilizados.some((eq) => eq.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterCantidad === 'con_cantidad') {
      return item.tiene_cantidad_informada;
    }
    if (filterCantidad === 'sin_cantidad') {
      return !item.tiene_cantidad_informada;
    }
    return true;
  });

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar repuesto, código o equipo..."
          aria-label="Buscar repuesto o código"
          className="modern-input text-xs pr-8 py-2"
        />
        {search ? (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={loadRepuestos}
        isLoading={loading}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        aria-label="Recargar repuestos"
      >
        <span className="hidden sm:inline">Recargar</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title="Repuestos y Materiales Mencionados"
        subtitle="Consolidado de componentes y consumibles registrados en las intervenciones confirmadas"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Repuestos', active: true },
        ]}
        actions={actions}
      />

      {/* Nota técnica sobre kardex / inventario */}
      <Card className="p-3.5 text-xs bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Aviso de alcance:</strong> Esta sección refleja la frecuencia de mención y las cantidades informadas por los técnicos en sus relatos de Telegram. No constituye un sistema de inventario, kardex ni control de existencias de almacén.
        </p>
      </Card>

      {/* Card Principal */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Listado de Componentes Mencionados</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                {filteredRepuestos.length}
              </span>
            </CardTitle>
          </div>

          {/* Filtro por cantidad informada */}
          <div
            role="group"
            aria-label="Filtro de cantidad"
            className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
          >
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'con_cantidad', label: 'Con cantidad' },
                { id: 'sin_cantidad', label: 'Sin cantidad' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilterCantidad(opt.id)}
                aria-pressed={filterCantidad === opt.id}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filterCantidad === opt.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : filteredRepuestos.length === 0 ? (
            <EmptyState
              icon={Package}
              title={search ? 'No se encontraron repuestos' : 'No hay repuestos registrados'}
              description={
                search
                  ? `No hay repuestos que coincidan con "${search}".`
                  : 'Los componentes aparecerán conforme los técnicos los mencionen en sus audios o textos de Telegram.'
              }
              actionLabel={search ? 'Borrar búsqueda' : undefined}
              onAction={search ? () => setSearch('') : undefined}
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Componente / Repuesto</th>
                      <th className="py-3 px-4">Código / Tag</th>
                      <th className="py-3 px-4">Frecuencia de Mención</th>
                      <th className="py-3 px-4">Unidades Informadas</th>
                      <th className="py-3 px-4">Equipos Asociados</th>
                      <th className="py-3 px-4 text-right">Último Uso Registrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRepuestos.map((rep, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {rep.nombre}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {rep.codigo ? (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {rep.codigo}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No especificado</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                            {rep.total_menciones} intervención{rep.total_menciones === 1 ? '' : 'es'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {rep.tiene_cantidad_informada ? (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {formatUnidadesRepuesto(rep.unidades_totales)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              No especificada
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {rep.equipos_utilizados.length > 0 ? (
                            <span title={rep.equipos_utilizados.join(', ')}>
                              {rep.equipos_utilizados.slice(0, 2).join(', ')}
                              {rep.equipos_utilizados.length > 2 && (
                                <span className="text-slate-400 text-[10px] ml-1">
                                  (+{rep.equipos_utilizados.length - 2})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin equipo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatFechaHoraLima(rep.ultimo_uso)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {filteredRepuestos.map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {rep.nombre}
                      </span>
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {rep.total_menciones} menciones
                      </span>
                    </div>

                    {rep.codigo && (
                      <div className="text-[11px] font-mono text-slate-500">
                        Código / Tag: {rep.codigo}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        Cantidad:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatUnidadesRepuesto(rep.unidades_totales)}
                        </strong>
                      </span>
                      <span>{formatFechaHoraLima(rep.ultimo_uso)}</span>
                    </div>

                    {rep.equipos_utilizados.length > 0 && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        Equipos: {rep.equipos_utilizados.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <CardFooter>
          <span>Central Cogeneración · Menciones extraídas de reportes técnicos confirmados</span>
        </CardFooter>
      </Card>
    </div>
  );
}
