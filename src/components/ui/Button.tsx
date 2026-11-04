import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus-visible:ring-blue-500 border border-blue-600 hover:border-blue-700',
      secondary:
        'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 focus-visible:ring-slate-400',
      outline:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400 border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500 border border-rose-600',
      success:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-emerald-500 border border-emerald-600',
      warning:
        'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold shadow-xs focus-visible:ring-amber-500 border border-amber-500',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-[11px] gap-1.5 min-w-[28px]',
      sm: 'h-8 sm:h-8.5 px-3 text-xs gap-1.5 min-w-[34px]',
      md: 'h-9 sm:h-10 px-4 text-xs sm:text-sm gap-2 min-w-[38px]',
      lg: 'h-11 px-5 text-sm sm:text-base gap-2.5 min-w-[44px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';