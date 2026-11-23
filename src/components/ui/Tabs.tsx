import React from 'react';
import { cn } from '@/lib/utils';
import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl';

export function Tabs<T extends string = string>(props: SegmentedControlProps<T>) {
  return <SegmentedControl {...props} />;
}
