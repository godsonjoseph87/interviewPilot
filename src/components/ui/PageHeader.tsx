import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border',
        className
      )}
    >
      <div className="space-y-1.5 max-w-2xl">
        {eyebrow && (
          <div className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="text-display font-display font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-body text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
