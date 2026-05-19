'use client';

import { useEffect, useState, useTransition } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { CopyInviteButton } from './CopyInviteButton';
import { getCircle, listCircleMembers } from '@/lib/circles/queries';
import { leaveCircle } from '@/lib/circles/actions';
import type { CircleMember, CircleSummary } from '@/lib/circles/types';

type Props = {
  circleId: string;
  onBack: () => void;
  onLeft: () => void;
};

export function CircleDetail({ circleId, onBack, onLeft }: Props) {
  const [circle, setCircle] = useState<CircleSummary | null>(null);
  const [members, setMembers] = useState<CircleMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCircle(circleId), listCircleMembers(circleId)]).then(([c, m]) => {
      if (cancelled) return;
      setCircle(c);
      setMembers(m);
    });
    return () => {
      cancelled = true;
    };
  }, [circleId]);

  function handleLeave() {
    const isLast = (members?.length ?? 0) <= 1;
    const message = isLast
      ? 'You’re the only member. Leaving will delete this circle. Continue?'
      : `Leave “${circle?.name ?? 'this circle'}”?`;
    if (!confirm(message)) return;

    startTransition(async () => {
      const result = await leaveCircle(circleId);
      if (result.status === 'success') {
        onLeft();
      } else if (result.status === 'error') {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} aria-hidden />
        Back to circles
      </button>

      {circle && (
        <header className="space-y-1">
          <h3 className="font-display text-2xl font-semibold">{circle.name}</h3>
          <p className="text-xs text-muted">
            {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
          </p>
        </header>
      )}

      {circle && (
        <section className="space-y-2 rounded-md border border-border bg-bg p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Invite code</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 select-all rounded-sm bg-surface px-2 py-1.5 font-mono text-lg tracking-widest">
              {circle.invite_code}
            </code>
            <CopyInviteButton code={circle.invite_code} />
          </div>
          <p className="text-xs text-muted">
            Share this with someone to let them join. Codes don’t expire.
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted">Members</h4>
        {members === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between rounded-md bg-surface px-3 py-2"
              >
                <span className="text-sm">{m.display_name}</span>
                {m.role === 'owner' && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    Owner
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-3 border-t border-border pt-4">
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Button
          variant="danger"
          size="sm"
          loading={isPending}
          onClick={handleLeave}
          className="w-full"
        >
          <LogOut size={14} aria-hidden />
          Leave circle
        </Button>
      </div>
    </div>
  );
}
