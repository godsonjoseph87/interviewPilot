import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5 font-medium">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className={cn(
          'h-2 w-full overflow-hidden rounded-full bg-secondary/80',
          className
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-cyan-500 to-blue-600',
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

