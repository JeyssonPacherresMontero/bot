import React, { useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      children,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full appearance-none px-3 py-2 pr-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border transition-all duration-150 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
              error
                ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:text-rose-100'
                : 'border-slate-200 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20',
              disabled && 'opacity-50 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {children}
          </select>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-[11px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';