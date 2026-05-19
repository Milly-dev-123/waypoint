import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-fg', className)}
        {...props}
      />
    );
  },
);
