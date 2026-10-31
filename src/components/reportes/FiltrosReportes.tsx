'use client';

import React from 'react';
import { Filter, X, AlertCircle } from 'lucide-react';
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

  const estadosDisponibles: { id: EstadoReporte; label: string; activeColor: string }[] = [
    { id: 'pendiente', label: 'Pendiente', activeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
    { id: 'corregido', label: 'Corregido', activeColor: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' },
    { id: 'confirmado', label: 'Confirmado', activeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
    { id: 'revisado', label: 'Revisado', activeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
    { id: 'rechazado', label: 'Rechazado', activeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
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
    <div className="modern-card">
      <div className="modern-card-header">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Filtros y Búsqueda de Reportes
          </span>
        </div>
        {hasFiltrosActivos && (
          <button
            onClick={onLimpiar}
            className="btn-modern-danger text-xs px-2.5 py-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="modern-card-body space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
            Búsqueda General
          </label>
          <div className="relative flex">
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
              placeholder="Buscar por equipo, código P-101A, falla, técnico u orden de trabajo..."
              className="modern-input pr-8 py-2"
            />
            {filtros.busqueda && (
              <button
                onClick={() => onChange({ ...filtros, busqueda: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
          {/* Prioridad */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Prioridad
            </label>
            <select
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Tipo de Mantenimiento
            </label>
            <select
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Canal de Origen
            </label>
            <select
              value={filtros.origen}
              onChange={(e) => onChange({ ...filtros, origen: e.target.value as OrigenReporte | '' })}
              className="modern-input py-2"
            >
              <option value="">Audio y Texto</option>
              <option value="audio">Solo Audio</option>
              <option value="texto">Solo Texto</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
              className="modern-input py-2"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
              className="modern-input py-2"
            />
          </div>
        </div>

        {/* Status Badges & Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              Estado:
            </span>
            {estadosDisponibles.map((item) => {
              const isSelected = filtros.estados.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleEstado(item.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    isSelected
                      ? item.activeColor
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={filtros.soloFaltantes}
              onChange={(e) => onChange({ ...filtros, soloFaltantes: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
            />
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Con datos pendientes de completar
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
