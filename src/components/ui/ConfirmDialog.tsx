import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    danger: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    primary: <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  };

  const iconBgs = {
    danger: 'bg-rose-500/10 border-rose-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    primary: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" closeOnOutsideClick={!isLoading}>
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${iconBgs[variant]}`}
          >
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}