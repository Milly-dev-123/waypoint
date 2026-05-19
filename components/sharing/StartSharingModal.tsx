'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { CirclePicker } from './CirclePicker';
import { DurationPicker } from './DurationPicker';
import { useSharing } from './SharingProvider';
import { listMyCircles } from '@/lib/circles/queries';
import type { CircleSummary } from '@/lib/circles/types';
import type { DurationMinutes } from '@/lib/sharing/types';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StartSharingModal({ open, onClose }: Props) {
  const { start } = useSharing();
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load circles each time the modal opens (in case the list changed).
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelected(new Set());
    setDuration(null);
    listMyCircles().then(setCircles);
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const canSubmit = selected.size > 0 && duration !== null && !submitting;

  async function handleConfirm() {
    if (!duration || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    const result = await start(Array.from(selected), duration);
    setSubmitting(false);
    if (result.ok) {
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-fg/40 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={(e) => {
        // Close on backdrop click only — guard against accidental drag-outs.
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-surface shadow-lift md:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="share-modal-title" className="font-display text-lg font-semibold">
            Share your location
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted hover:bg-accent-soft hover:text-fg disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
              Who can see your location
            </h3>
            {circles === null ? (
              <p className="text-sm text-muted">Loading circles…</p>
            ) : (
              <CirclePicker circles={circles} selected={selected} onChange={setSelected} />
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
              For how long
            </h3>
            <DurationPicker value={duration} onChange={setDuration} />
          </section>

          <p className="text-xs text-muted">
            Your circle members will see your location until the time runs out or you stop. You can
            stop anytime from the red banner at the top.
          </p>

          {error && <FormMessage tone="error">{error}</FormMessage>}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border bg-bg px-4 py-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canSubmit} loading={submitting}>
            Start sharing
          </Button>
        </footer>
      </div>
    </div>
  );
}
