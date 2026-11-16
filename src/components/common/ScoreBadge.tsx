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
    const config: Record<string, { bg: string; text: string; border: string }> = {
      'Strong Hire': {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      },
      Hire: {
        bg: 'bg-cyan-500/15',
        text: 'text-cyan-300',
        border: 'border-cyan-500/30',
      },
      'Lean Hire': {
        bg: 'bg-blue-500/15',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
      },
      'Lean No Hire': {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      },
      'No Hire': {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      },
    };

    const style = config[recommendation] || {
      bg: 'bg-slate-800',
      text: 'text-slate-300',
      border: 'border-slate-700',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs font-semibold',
      lg: 'px-4 py-1.5 text-sm font-bold',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border shadow-sm',
          style.bg,
          style.text,
          style.border,
          sizeClasses[size],
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
        {recommendation}
      </span>
    );
  }

  if (score !== undefined) {
    let colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (score >= 85) {
      colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (score >= 70) {
      colorClass = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
    } else if (score >= 50) {
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm font-semibold',
      lg: 'px-3.5 py-1.5 text-base font-bold',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-lg border font-mono',
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

