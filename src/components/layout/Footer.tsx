import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#343a40] border-t border-[#dee2e6] dark:border-[#4b545c] px-4 sm:px-6 py-3 text-xs text-[#6c757d] dark:text-[#ced4da] flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
      <div>
        <strong>
          Copyright &copy; 2026{' '}
          <span className="text-[#007bff] hover:underline font-bold">
            MaintAI LTE
          </span>
          .
        </strong>{' '}
        Todos los derechos reservados.
      </div>
      <div className="flex items-center gap-2">
        <span>Vaporsur Energía S.A.C.</span>
        <span>·</span>
        <span>Refinería Bahía Norte</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline font-semibold">
          <b>Versión</b> 3.4.0
        </span>
      </div>
    </footer>
  );
}
