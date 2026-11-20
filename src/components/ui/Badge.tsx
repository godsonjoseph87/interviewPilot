import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-yellow-500/15 text-amber-900 font-semibold shadow-xs',
        secondary:
          'border-amber-200/60 bg-amber-50/60 text-stone-800',
        destructive:
          'border-rose-300 bg-rose-50 text-rose-800',
        outline: 'text-stone-800 border-border bg-white',
        success:
          'border-emerald-300 bg-emerald-50 text-emerald-800',
        warning:
          'border-amber-300 bg-amber-50 text-amber-900',
        accent:
          'border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-950 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

