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
    <div className="pt-2 pb-5 mb-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 text-xs text-slate-400">
            {breadcrumbs.map((crumb, idx) => {
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400/80 shrink-0" />}
                  <li className="flex items-center">
                    {crumb.href && !crumb.active ? (
                      <Link
                        href={crumb.href}
                        className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
