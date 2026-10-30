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
    { id: 'pendiente', label: 'Pendiente', activeColor: 'bg-[#ffc107] text-[#1f2d3d] border-[#ffc107]' },
    { id: 'corregido', label: 'Corregido', activeColor: 'bg-[#fd7e14] text-white border-[#fd7e14]' },
    { id: 'confirmado', label: 'Confirmado', activeColor: 'bg-[#007bff] text-white border-[#007bff]' },
    { id: 'revisado', label: 'Revisado', activeColor: 'bg-[#28a745] text-white border-[#28a745]' },
    { id: 'rechazado', label: 'Rechazado', activeColor: 'bg-[#dc3545] text-white border-[#dc3545]' },
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
    <div className="lte-card border-t-[3px] border-t-[#007bff]">
      <div className="lte-card-header">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#007bff]" />
          <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
            Filtros y Búsqueda de Reportes
          </span>
        </div>
        {hasFiltrosActivos && (
          <button
            onClick={onLimpiar}
            className="btn-lte-danger text-xs px-2 py-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="lte-card-body space-y-3">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
            Búsqueda General
          </label>
          <div className="relative flex">
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
              placeholder="Buscar por equipo, código (P-101A), falla, técnico, OT o texto..."
              className="form-control-lte pr-8"
            />
            {filtros.busqueda && (
              <button
                onClick={() => onChange({ ...filtros, busqueda: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#212529] dark:hover:text-[#f8f9fa]"
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
            <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
              Prioridad
            </label>
            <select
              value={filtros.prioridad}
              onChange={(e) => onChange({ ...filtros, prioridad: e.target.value as PrioridadReporte | '' })}
              className="form-control-lte"
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
            <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => onChange({ ...filtros, tipo: e.target.value as TipoMantenimiento | '' })}
              className="form-control-lte"
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
            <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
              Origen
            </label>
            <select
              value={filtros.origen}
              onChange={(e) => onChange({ ...filtros, origen: e.target.value as OrigenReporte | '' })}
              className="form-control-lte"
            >
              <option value="">Audio y Texto</option>
              <option value="audio">Solo Audio</option>
              <option value="texto">Solo Texto</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
              className="form-control-lte"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
              className="form-control-lte"
            />
          </div>
        </div>

        {/* Status Badges & Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#dee2e6] dark:border-[#4b545c]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#495057] dark:text-[#ced4da] mr-1">
              Estado:
            </span>
            {estadosDisponibles.map((item) => {
              const isSelected = filtros.estados.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleEstado(item.id)}
                  className={`px-2.5 py-0.5 rounded-[0.25rem] text-xs font-semibold transition-all border ${
                    isSelected
                      ? item.activeColor
                      : 'bg-white dark:bg-[#343a40] text-[#6c757d] dark:text-[#adb5bd] border-[#ced4da] dark:border-[#6c757d] hover:bg-[#e9ecef]'
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
              className="w-4 h-4 rounded-[0.2rem] text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
            />
            <span className="flex items-center gap-1 text-[#495057] dark:text-[#ced4da] font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-[#ffc107]" />
              Con datos faltantes
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
