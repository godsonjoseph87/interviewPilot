import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-small font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover btn-primary-glow font-semibold',
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover btn-primary-glow font-semibold',
        secondary:
          'bg-surface-raised text-foreground hover:bg-muted border border-border shadow-xs hover:shadow-sm',
        outline:
          'border border-border bg-transparent hover:bg-surface-raised text-foreground hover:border-border-strong shadow-xs',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-surface-raised',
        subtle:
          'bg-primary-subtle text-primary hover:bg-primary-subtle/80 border border-primary-border',
        danger:
          'bg-danger text-white hover:bg-danger/90 shadow-xs hover:shadow-sm font-semibold',
        destructive:
          'bg-danger text-white hover:bg-danger/90 shadow-xs hover:shadow-sm font-semibold',
        success:
          'bg-success text-white hover:bg-success/90 shadow-xs hover:shadow-sm font-semibold',
        accent:
          'bg-primary text-primary-foreground hover:bg-primary-hover btn-primary-glow font-semibold',
        link:
          'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2 text-small',
        md: 'h-9 px-4 py-2 text-small',
        sm: 'h-8 px-3 text-caption font-medium',
        xs: 'h-7 px-2.5 text-caption font-medium',
        lg: 'h-10 px-5 text-body font-semibold',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            {children}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
