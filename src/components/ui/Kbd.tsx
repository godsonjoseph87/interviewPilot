import React from 'react';
import { cn } from '@/lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded border border-border bg-surface-raised px-1.5 py-0.5 text-caption font-mono text-muted-foreground shadow-2xs select-none',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
