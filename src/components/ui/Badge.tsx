import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/15 text-cyan-300 border-cyan-500/30',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive/15 text-rose-400 border-rose-500/30',
        outline: 'text-foreground border-border',
        success:
          'border-transparent bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        warning:
          'border-transparent bg-amber-500/15 text-amber-400 border-amber-500/30',
        accent:
          'border-transparent bg-violet-500/15 text-violet-300 border-violet-500/30',
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

