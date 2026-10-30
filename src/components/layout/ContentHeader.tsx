import React from 'react';
import Link from 'next/link';

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
    <div className="pt-2 pb-4 mb-4 border-b border-[#dee2e6] dark:border-[#4b545c]/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#212529] dark:text-[#f8f9fa] flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#6c757d] dark:text-[#ced4da] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 text-xs text-[#6c757d] dark:text-[#ced4da]">
            {breadcrumbs.map((crumb, idx) => {
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-[#adb5bd]">/</span>}
                  <li className="flex items-center">
                    {crumb.href && !crumb.active ? (
                      <Link
                        href={crumb.href}
                        className="text-[#007bff] hover:underline hover:text-[#0056b3] transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-[#495057] dark:text-[#e9ecef] font-semibold">
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
