import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent/90',
  secondary: 'bg-surface text-fg border border-border hover:bg-accent-soft',
  ghost: 'text-fg hover:bg-accent-soft',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
});
