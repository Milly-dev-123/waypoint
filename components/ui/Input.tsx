import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg',
        'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
});
