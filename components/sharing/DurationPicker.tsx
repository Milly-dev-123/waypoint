'use client';

import { DURATIONS_MINUTES, DURATION_LABELS, type DurationMinutes } from '@/lib/sharing/types';
import { cn } from '@/lib/utils/cn';

type Props = {
  value: DurationMinutes | null;
  onChange: (next: DurationMinutes) => void;
};

export function DurationPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Duration" className="grid grid-cols-2 gap-2">
      {DURATIONS_MINUTES.map((mins) => {
        const isSelected = value === mins;
        return (
          <button
            key={mins}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(mins)}
            className={cn(
              'rounded-md border px-3 py-2.5 text-sm font-medium transition',
              isSelected
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-surface text-fg hover:border-accent/60',
            )}
          >
            {DURATION_LABELS[mins]}
          </button>
        );
      })}
    </div>
  );
}
