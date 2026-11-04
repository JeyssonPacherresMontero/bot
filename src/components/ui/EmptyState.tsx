import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'py-12 px-4 sm:px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3.5 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAction}
              leftIcon={actionIcon}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}