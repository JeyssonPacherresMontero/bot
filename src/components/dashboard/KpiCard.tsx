import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
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
  const variantStyles = {
    info: {
      bg: 'bg-[#17a2b8] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
    success: {
      bg: 'bg-[#28a745] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
    warning: {
      bg: 'bg-[#ffc107] text-[#1f2d3d]',
      footer: 'bg-black/15 hover:bg-black/25 text-[#1f2d3d]',
      iconOpacity: 'text-black/15',
    },
    danger: {
      bg: 'bg-[#dc3545] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
    primary: {
      bg: 'bg-[#007bff] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
    purple: {
      bg: 'bg-[#6f42c1] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
    default: {
      bg: 'bg-[#6c757d] text-white',
      footer: 'bg-black/15 hover:bg-black/25 text-white',
      iconOpacity: 'text-white/20',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-[0.25rem] shadow-lte transition-transform hover:-translate-y-0.5 select-none flex flex-col justify-between',
        style.bg
      )}
    >
      <div className="p-4 relative z-10">
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
            {value}
          </h3>
          {trend && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-black/20">
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm font-medium uppercase tracking-wider mt-1 opacity-95">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] mt-1 opacity-80 line-clamp-1">{subtitle}</p>
        )}
      </div>

      {/* AdminLTE large background watermark icon */}
      <div
        className={cn(
          'absolute -right-2 top-0 pointer-events-none transition-all duration-300',
          style.iconOpacity
        )}
      >
        <Icon className="w-20 h-20 sm:w-24 sm:h-24 transform translate-y-1" />
      </div>

      {/* AdminLTE small-box footer */}
      {href && href !== '#' ? (
        <Link
          href={href}
          className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold transition-colors z-10',
            style.footer
          )}
        >
          <span>Más detalles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold z-10',
            style.footer
          )}
        >
          <span>Supervisión en vivo</span>
        </div>
      )}
    </div>
  );

  return content;
}
