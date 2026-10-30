'use client';

import React from 'react';
import { Search, Filter, X, AlertCircle } from 'lucide-react';
import type { EstadoReporte, PrioridadReporte, TipoMantenimiento, OrigenReporte } from '@/types/database.types';

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
  const toggleEstado = (estado: EstadoReporte) => {
    const exists = filtros.estados.includes(estado);
    const nuevosEstados = exists
      ? filtros.estados.filter((e) => e !== estado)
      : [...filtros.estados, estado];
    onChange({ ...filtros, estados: nuevosEstados });
  };

  const estadosDisponibles: { id: EstadoReporte; label: string }[] = [
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'corregido', label: 'Corregido' },
    { id: 'confirmado', label: 'Confirmado' },
    { id: 'revisado', label: 'Revisado' },
    { id: 'rechazado', label: 'Rechazado' },
  ];

  const hasFiltrosActivos =
    filtros.busqueda.trim() !== '' ||
    filtros.estados.length > 0 ||
    filtros.prioridad !== '' ||
    filtros.tipo !== '' ||
    filtros.origen !== '' ||
    filtros.soloFaltantes ||
    filtros.fechaDesde !== '' ||
    filtros.fechaHasta !== '';

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
            placeholder="Buscar por equipo, código (P-101A), falla, técnico, OT o texto..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {filtros.busqueda && (
            <button
              onClick={() => onChange({ ...filtros, busqueda: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasFiltrosActivos && (
          <button
            onClick={onLimpiar}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Prioridad */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Prioridad
          </label>
          <select
            value={filtros.prioridad}
            onChange={(e) => onChange({ ...filtros, prioridad: e.target.value as PrioridadReporte | '' })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        {/* Tipo Mantenimiento */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Tipo
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => onChange({ ...filtros, tipo: e.target.value as TipoMantenimiento | '' })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Origen
          </label>
          <select
            value={filtros.origen}
            onChange={(e) => onChange({ ...filtros, origen: e.target.value as OrigenReporte | '' })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Audio y Texto</option>
            <option value="audio">Solo Audio</option>
            <option value="texto">Solo Texto</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Multi-status pills & missing fields toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Estado:
          </span>
          {estadosDisponibles.map((item) => {
            const isSelected = filtros.estados.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleEstado(item.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filtros.soloFaltantes}
            onChange={(e) => onChange({ ...filtros, soloFaltantes: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Con datos faltantes
          </span>
        </label>
      </div>
    </div>
  );
}
