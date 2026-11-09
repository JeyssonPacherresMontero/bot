'use client';

import React, { useState } from 'react';
import { Filter, X, AlertCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { EstadoReporte, PrioridadReporte, TipoMantenimiento, OrigenReporte } from '@/types/database.types';
import { Button } from '@/components/ui/Button';

export interface FiltrosReportesState {
  busqueda: string;
  estados: EstadoReporte[];
  prioridad: PrioridadReporte | '';
  tipo: TipoMantenimiento | '';
  origen: OrigenReporte | '';
  soloFaltantes: boolean;
  fechaDesde: string;
  fechaHasta: string;
}

interface FiltrosReportesProps {
  filtros: FiltrosReportesState;
  onChange: (nuevosFiltros: FiltrosReportesState) => void;
  onLimpiar: () => void;
}

export function FiltrosReportes({ filtros, onChange, onLimpiar }: FiltrosReportesProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const toggleEstado = (estado: EstadoReporte) => {
    const exists = filtros.estados.includes(estado);
    const nuevosEstados = exists
      ? filtros.estados.filter((e) => e !== estado)
      : [...filtros.estados, estado];
    onChange({ ...filtros, estados: nuevosEstados });
  };

  const estadosDisponibles: { id: EstadoReporte; label: string; activeColor: string }[] = [
    { id: 'confirmado', label: 'Confirmados (Por revisar)', activeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 font-semibold' },
    { id: 'revisado', label: 'Revisados', activeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold' },
    { id: 'rechazado', label: 'Rechazados', activeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-semibold' },
    { id: 'pendiente', label: 'Pendiente (Histórico)', activeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40' },
    { id: 'corregido', label: 'Corregido (Histórico)', activeColor: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40' },
  ];

  const activeFiltersCount =
    (filtros.busqueda.trim() ? 1 : 0) +
    filtros.estados.length +
    (filtros.prioridad ? 1 : 0) +
    (filtros.tipo ? 1 : 0) +
    (filtros.origen ? 1 : 0) +
    (filtros.soloFaltantes ? 1 : 0) +
    (filtros.fechaDesde ? 1 : 0) +
    (filtros.fechaHasta ? 1 : 0);

  const hasFiltrosActivos = activeFiltersCount > 0;

  return (
    <div className="modern-card">
      <div className="modern-card-header">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Filtros y Búsqueda de Reportes
          </span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasFiltrosActivos && (
            <Button
              variant="outline"
              size="xs"
              onClick={onLimpiar}
              leftIcon={<RotateCcw className="w-3 h-3" />}
            >
              Limpiar filtros
            </Button>
          )}

          {/* Mobile expand / collapse toggle */}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-expanded={mobileExpanded}
            aria-label={mobileExpanded ? 'Contraer filtros' : 'Expandir filtros'}
          >
            {mobileExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="modern-card-body space-y-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="filtro-busqueda-general"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
          >
            Búsqueda General
          </label>
          <div className="relative flex">
            <input
              id="filtro-busqueda-general"
              type="text"
              value={filtros.busqueda}
              onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
              placeholder="Buscar por equipo, código/tag, área de planta, falla, técnico u OT..."
              className="modern-input pr-8 py-2"
            />
            {filtros.busqueda && (
              <button
                onClick={() => onChange({ ...filtros, busqueda: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                aria-label="Borrar texto de búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Extended filters */}
        <div className={`${mobileExpanded ? 'block' : 'hidden'} sm:block space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
            {/* Prioridad */}
            <div>
              <label
                htmlFor="filtro-prioridad"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Prioridad
              </label>
              <select
                id="filtro-prioridad"
                value={filtros.prioridad}
                onChange={(e) => onChange({ ...filtros, prioridad: e.target.value as PrioridadReporte | '' })}
                className="modern-input py-2"
              >
                <option value="">Todas las prioridades</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            {/* Tipo Mantenimiento */}
            <div>
              <label
                htmlFor="filtro-tipo"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Tipo de Mantenimiento
              </label>
              <select
                id="filtro-tipo"
                value={filtros.tipo}
                onChange={(e) => onChange({ ...filtros, tipo: e.target.value as TipoMantenimiento | '' })}
                className="modern-input py-2"
              >
                <option value="">Todos los tipos</option>
                <option value="correctivo">Correctivo</option>
                <option value="preventivo">Preventivo</option>
                <option value="predictivo">Predictivo</option>
                <option value="inspeccion">Inspección</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Origen */}
            <div>
              <label
                htmlFor="filtro-origen"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Canal de Origen
              </label>
              <select
                id="filtro-origen"
                value={filtros.origen}
                onChange={(e) => onChange({ ...filtros, origen: e.target.value as OrigenReporte | '' })}
                className="modern-input py-2"
              >
                <option value="">Audio y Texto</option>
                <option value="audio">Solo Audio Telegram</option>
                <option value="texto">Solo Texto Telegram</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label
                htmlFor="filtro-desde"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Fecha Desde
              </label>
              <input
                id="filtro-desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
                className="modern-input py-2"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label
                htmlFor="filtro-hasta"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Fecha Hasta
              </label>
              <input
                id="filtro-hasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
                className="modern-input py-2"
              />
            </div>
          </div>

          {/* Status Badges & Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por estado">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                Estado:
              </span>
              {estadosDisponibles.map((item) => {
                const isSelected = filtros.estados.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleEstado(item.id)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1 rounded-lg text-xs transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? item.activeColor
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label
              htmlFor="filtro-solo-faltantes"
              className="inline-flex items-center gap-2 cursor-pointer select-none text-xs"
            >
              <input
                id="filtro-solo-faltantes"
                type="checkbox"
                checked={filtros.soloFaltantes}
                onChange={(e) => onChange({ ...filtros, soloFaltantes: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
              />
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Con datos faltantes según IA
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
