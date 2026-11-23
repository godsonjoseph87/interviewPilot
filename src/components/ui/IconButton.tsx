import React from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'icon', variant = 'ghost', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';
