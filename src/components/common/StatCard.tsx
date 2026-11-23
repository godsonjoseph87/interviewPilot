import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden group transition-all duration-150 hover:border-border-strong hover:bg-surface-raised',
        className
      )}
    >
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
              {value}
            </h4>
            {trend && (
              <span
                className={cn(
                  'text-caption font-medium px-1.5 py-0.5 rounded font-mono tabular-nums',
                  trend.isPositive
                    ? 'text-success-foreground bg-success-subtle border border-success-border'
                    : 'text-danger-foreground bg-danger-subtle border border-danger-border'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-caption text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary-subtle border border-primary-border text-primary flex items-center justify-center shrink-0 shadow-2xs transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
