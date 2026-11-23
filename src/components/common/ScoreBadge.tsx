import React from 'react';
import { cn } from '@/lib/utils';
import type { HiringRecommendation } from '@/types';

interface ScoreBadgeProps {
  score?: number;
  recommendation?: HiringRecommendation | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBadge({
  score,
  recommendation,
  size = 'md',
  className,
}: ScoreBadgeProps) {
  if (recommendation) {
    const config: Record<
      string,
      { bg: string; text: string; border: string; dot: string }
    > = {
      'Strong Hire': {
        bg: 'bg-success-subtle',
        text: 'text-success-foreground',
        border: 'border-success-border',
        dot: 'bg-success',
      },
      Hire: {
        bg: 'bg-primary-subtle',
        text: 'text-primary',
        border: 'border-primary-border',
        dot: 'bg-primary',
      },
      'Lean Hire': {
        bg: 'bg-info-subtle',
        text: 'text-info-foreground',
        border: 'border-info-border',
        dot: 'bg-info',
      },
      'Lean No Hire': {
        bg: 'bg-warning-subtle',
        text: 'text-warning-foreground',
        border: 'border-warning-border',
        dot: 'bg-warning',
      },
      'No Hire': {
        bg: 'bg-danger-subtle',
        text: 'text-danger-foreground',
        border: 'border-danger-border',
        dot: 'bg-danger',
      },
    };

    const style = config[recommendation] || {
      bg: 'bg-surface-raised',
      text: 'text-muted-foreground',
      border: 'border-border',
      dot: 'bg-muted-foreground',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-caption',
      md: 'px-2.5 py-1 text-caption font-medium',
      lg: 'px-3.5 py-1.5 text-small font-semibold',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border shadow-2xs font-medium select-none',
          style.bg,
          style.text,
          style.border,
          sizeClasses[size],
          className
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5 shrink-0', style.dot)} />
        {recommendation}
      </span>
    );
  }

  if (score !== undefined) {
    let colorClass = 'text-danger-foreground bg-danger-subtle border-danger-border';
    if (score >= 80) {
      colorClass = 'text-success-foreground bg-success-subtle border-success-border';
    } else if (score >= 60) {
      colorClass = 'text-info-foreground bg-info-subtle border-info-border';
    } else if (score >= 40) {
      colorClass = 'text-warning-foreground bg-warning-subtle border-warning-border';
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-caption',
      md: 'px-2.5 py-1 text-small font-semibold',
      lg: 'px-3.5 py-1.5 text-body font-bold',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border font-mono tabular-nums shadow-2xs select-none',
          colorClass,
          sizeClasses[size],
          className
        )}
      >
        {score} / 100
      </span>
    );
  }

  return null;
}
