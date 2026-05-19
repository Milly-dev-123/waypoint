import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-surface p-6 shadow-soft',
        className,
      )}
      {...props}
    />
  );
});
