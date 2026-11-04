import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function ContentHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: ContentHeaderProps) {
  return (
    <div className="pt-1 pb-4 sm:pb-5 mb-5 sm:mb-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <nav aria-label="Ruta de navegación" className="mb-1.5">
          <ol className="flex items-center flex-wrap gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((crumb, idx) => {
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />}
                  <li className="flex items-center">
                    {crumb.href && !crumb.active ? (
                      <Link
                        href={crumb.href}
                        className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-semibold" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>

        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}