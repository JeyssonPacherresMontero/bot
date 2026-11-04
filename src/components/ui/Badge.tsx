import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    brand: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    purple: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  };

  const dotColors = {
    brand: 'bg-blue-500',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-indigo-500',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded gap-1 font-medium',
    md: 'text-xs px-2.5 py-0.5 rounded-md gap-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}