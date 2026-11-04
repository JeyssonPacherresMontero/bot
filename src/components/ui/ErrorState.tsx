import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Ocurrió un error al cargar la información',
  message = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión o intenta nuevamente.',
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'py-10 px-4 sm:px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 shadow-xs">
        <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}