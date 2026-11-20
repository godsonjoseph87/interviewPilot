import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-xs hover:shadow-sm',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-600 text-stone-950 font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 border border-amber-400/50',
        secondary:
          'bg-amber-50/80 text-amber-950 hover:bg-amber-100/80 border border-amber-200/80 font-medium shadow-xs hover:shadow-sm',
        outline:
          'border border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-800 hover:border-amber-500/80 shadow-xs hover:shadow-sm font-medium',
        ghost:
          'hover:bg-amber-50/70 text-stone-700 hover:text-stone-950 shadow-none hover:shadow-none',
        destructive:
          'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 hover:shadow-rose-600/35',
        accent:
          'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 font-bold shadow-md shadow-amber-500/25 hover:shadow-amber-500/40',
        success:
          'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 font-semibold',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3.5 text-xs font-semibold',
        lg: 'h-11 rounded-lg px-6 text-base font-semibold',
        icon: 'h-9 w-9 rounded-md',
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
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

