import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Tone = 'error' | 'info' | 'success';

interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  error: 'text-danger',
  info: 'text-muted',
  success: 'text-accent',
};

export function FormMessage({ tone = 'info', className, ...props }: FormMessageProps) {
  return <p role={tone === 'error' ? 'alert' : undefined} className={cn('text-sm', toneClasses[tone], className)} {...props} />;
}
