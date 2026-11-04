'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    toast({ type: 'success', title, message });
  }, [toast]);

  const error = useCallback((title: string, message?: string) => {
    toast({ type: 'error', title, message, duration: 6000 });
  }, [toast]);

  const warning = useCallback((title: string, message?: string) => {
    toast({ type: 'warning', title, message });
  }, [toast]);

  const info = useCallback((title: string, message?: string) => {
    toast({ type: 'info', title, message });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container floating at top-right on desktop, top-center on mobile */}
      <div
        className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
        aria-live="polite"
        role="region"
        aria-label="Notificaciones del sistema"
      >
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
            info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
          };

          const borders = {
            success: 'border-emerald-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
            error: 'border-rose-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
            warning: 'border-amber-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
            info: 'border-blue-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
          };

          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto p-3.5 rounded-xl border shadow-dropdown flex items-start gap-3 transition-all duration-200 animate-slide-in-up',
                borders[t.type]
              )}
            >
              <div className="mt-0.5">{icons[t.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-tight">{t.title}</p>
                {t.message && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Cerrar notificación"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}