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
    <Card className={cn('relative overflow-hidden group hover:border-amber-400/70 bg-white border-amber-200/60 shadow-sm hover:shadow-md transition-all duration-300', className)}>
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-amber-400/20 transition-colors" />
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black tracking-tight text-foreground">
              {value}
            </h4>
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-500/15'
                    : 'text-rose-700 bg-rose-500/15'
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
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-500/20 text-amber-800 border border-amber-300/50 group-hover:scale-105 group-hover:shadow-sm transition-all">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

