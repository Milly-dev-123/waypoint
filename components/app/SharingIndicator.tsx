'use client';

// Phase 2A: placeholder rendering only. Wires to real sharing state in 2D.
// When isSharing=true the design calls for an alert-coloured pulsing dot
// and the text "Sharing with N people"; both are still TODO.

type Props = {
  isSharing?: boolean;
  count?: number;
};

export function SharingIndicator({ isSharing = false, count = 0 }: Props) {
  if (isSharing) {
    return (
      <span className="flex items-center gap-2 rounded-full bg-alert-soft px-3 py-1 text-xs font-medium text-alert">
        <span className="relative inline-block h-2 w-2 rounded-full bg-alert" aria-hidden />
        Sharing with {count} {count === 1 ? 'person' : 'people'}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-xs text-muted">
      <span className="inline-block h-2 w-2 rounded-full bg-muted/40" aria-hidden />
      Not sharing
    </span>
  );
}
