'use client';

import { CreateCircleForm } from './CreateCircleForm';
import { JoinCircleForm } from './JoinCircleForm';
import type { CircleSummary } from '@/lib/circles/types';

type Props = {
  circles: CircleSummary[] | null;
  onSelect: (circleId: string) => void;
  onMutated: () => void;
};

export function CirclesList({ circles, onSelect, onMutated }: Props) {
  return (
    <div className="space-y-5">
      {circles === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : circles.length === 0 ? (
        <p className="text-sm text-muted">
          You’re not in any circles yet. Create one for your family or join with a code.
        </p>
      ) : (
        <ul className="space-y-2">
          {circles.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-left transition hover:border-accent hover:bg-accent-soft"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted">
                  {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-border pt-5">
        <CreateCircleForm onCreated={onMutated} />
        <JoinCircleForm onJoined={onMutated} />
      </div>
    </div>
  );
}
