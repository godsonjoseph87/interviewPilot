import React from 'react';
import { cn } from '@/lib/utils';

export interface StatProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function Stat({
  label,
  value,
  description,
  trend,
  icon,
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5 shadow-xs transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-caption font-medium tabular-nums',
              trend.isPositive
                ? 'bg-success-subtle text-success-foreground'
                : 'bg-danger-subtle text-danger-foreground'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-caption text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
