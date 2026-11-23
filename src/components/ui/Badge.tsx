import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'border-primary-border bg-primary-subtle text-primary font-semibold',
        secondary:
          'border-border bg-surface-raised text-muted-foreground',
        outline:
          'border-border text-foreground bg-transparent',
        success:
          'border-success-border bg-success-subtle text-success-foreground font-medium',
        warning:
          'border-warning-border bg-warning-subtle text-warning-foreground font-medium',
        danger:
          'border-danger-border bg-danger-subtle text-danger-foreground font-medium',
        destructive:
          'border-danger-border bg-danger-subtle text-danger-foreground font-medium',
        info:
          'border-info-border bg-info-subtle text-info-foreground font-medium',
        accent:
          'border-primary-border bg-primary-subtle text-primary font-semibold',
        ai:
          'border-accent-2-border bg-accent-2-subtle text-accent-2 font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotClassName?: string;
}

export function Badge({
  className,
  variant,
  dot = false,
  dotClassName,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full mr-1.5 shrink-0',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            (variant === 'danger' || variant === 'destructive') && 'bg-danger',
            variant === 'info' && 'bg-info',
            variant === 'ai' && 'bg-accent-2',
            (variant === 'default' || variant === 'accent') && 'bg-primary',
            (variant === 'secondary' || variant === 'outline') && 'bg-muted-foreground',
            dotClassName
          )}
        />
      )}
      {children}
    </div>
  );
}
