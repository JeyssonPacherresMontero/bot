import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-slate-200/80 dark:bg-slate-800/80',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Cargando tabla...">
      {/* Header skeleton */}
      <div className="flex gap-4 p-3.5 bg-slate-100/90 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3.5"
            style={{ width: `${Math.max(40, 100 - i * 10)}%` }}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 p-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-lg items-center"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3 rounded"
              style={{
                width: c === 0 ? '40px' : `${Math.floor(55 + ((r * 13 + c * 17) % 35))}%`,
              }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Cargando datos...</span>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div
      className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3"
      role="status"
      aria-label="Cargando indicador..."
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4',
        className
      )}
      role="status"
      aria-label="Cargando tarjeta..."
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando detalle...">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-48" />
        </div>
        <div className="space-y-4">
          <CardSkeleton className="h-56" />
          <CardSkeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}