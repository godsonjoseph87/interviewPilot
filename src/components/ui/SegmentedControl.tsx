import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedControlItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  itemClassName?: string;
}

export function SegmentedControl<T extends string = string>({
  items,
  value,
  onChange,
  size = 'md',
  className,
  itemClassName,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-surface-raised p-0.5',
        className
      )}
    >
      {items.map((item) => {
        const isSelected = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
              size === 'sm' ? 'px-2.5 py-1 text-caption' : 'px-3 py-1.5 text-small',
              isSelected
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface/50',
              itemClassName
            )}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && <span className="ml-1 shrink-0">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
