import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-border text-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      {...props}
    />
  );
});
