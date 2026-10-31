import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 z-10 backdrop-blur-xs">
      <div>
        <span>
          &copy; 2026{' '}
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            MaintAI
          </span>
          . Gestión y Supervisión Operativa de Planta.
        </span>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <span>Vaporsur Energía</span>
        <span>·</span>
        <span>Refinería Bahía Norte</span>
      </div>
    </footer>
  );
}
