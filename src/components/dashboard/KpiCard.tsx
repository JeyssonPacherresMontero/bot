import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'success' | 'info' | 'purple';
  trend?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: KpiCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    warning: {
      bg: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400',
    },
    success: {
      bg: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400',
    },
    info: {
      bg: 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50',
      iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/50',
      iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        'p-5 rounded-xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between',
        style.bg
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className={cn('p-2.5 rounded-lg shrink-0', style.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
