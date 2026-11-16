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
    <Card className={cn('relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300', className)}>
      <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </h4>
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  trend.isPositive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-secondary/80 text-cyan-400 border border-border/50 group-hover:scale-105 transition-transform">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

