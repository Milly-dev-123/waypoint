'use client';

import type { CircleSummary } from '@/lib/circles/types';
import { Checkbox } from '@/components/ui/Checkbox';

type Props = {
  circles: CircleSummary[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
};

export function CirclePicker({ circles, selected, onChange }: Props) {
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  if (circles.length === 0) {
    return (
      <p className="text-sm text-muted">
        You’re not in any circles yet. Create or join one before sharing your location.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {circles.map((c) => {
        const checked = selected.has(c.id);
        return (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 hover:border-accent">
              <Checkbox checked={checked} onChange={() => toggle(c.id)} />
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted">
                  {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
                </span>
              </div>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
