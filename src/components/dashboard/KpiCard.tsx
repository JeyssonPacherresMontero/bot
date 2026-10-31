import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'success' | 'info' | 'purple' | 'danger' | 'primary';
  trend?: string;
  href?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  href = '#',
}: KpiCardProps) {
  // Psychological soft palette (restful on eyes, high contrast readable numbers)
  const variantThemes = {
    primary: {
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    info: {
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    success: {
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    danger: {
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    purple: {
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    default: {
      iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    },
  };

  const currentTheme = variantThemes[variant] || variantThemes.default;

  const cardContent = (
    <div className="p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <div className={cn('p-2 rounded-lg shrink-0', currentTheme.iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            {value}
          </h3>
          {trend && (
            <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', currentTheme.badgeBg)}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {href && href !== '#' && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <span>Ver detalles</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );

  const baseClasses =
    'relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group flex flex-col justify-between';

  if (href && href !== '#') {
    return (
      <Link href={href} className={baseClasses}>
        {cardContent}
      </Link>
    );
  }

  return <div className={baseClasses}>{cardContent}</div>;
}
