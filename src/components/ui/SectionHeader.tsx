import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 pb-3 border-b border-border',
        className
      )}
    >
      <div className="space-y-0.5">
        <h2 className="text-h2 font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-caption text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
