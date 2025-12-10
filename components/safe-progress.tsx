'use client';

import { cn } from '@/lib/utils';

interface SafeProgressProps {
  value: number | null | undefined;
  className?: string;
  max?: number;
}

export function SafeProgress({ value, className, max = 100 }: SafeProgressProps) {
  const safeValue = Math.min(max, Math.max(0, value || 0));
  const percentage = (safeValue / max) * 100;

  return (
    <div className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
