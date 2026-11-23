import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, rightIcon, error, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1.5 text-body text-foreground transition-colors placeholder:text-subtle-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
          icon && 'pl-9',
          rightIcon && 'pr-9',
          error && 'border-danger focus-visible:ring-danger/40',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (icon || rightIcon) {
      return (
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
              {icon}
            </div>
          )}
          {inputElement}
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = 'Input';
