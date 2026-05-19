'use client';

import { useEffect, useState } from 'react';
import { useSharing } from '@/components/sharing/SharingProvider';

// The TopBar pill — entry point when idle, status when active. Active
// stop control lives in the persistent banner; clicking the pill while
// sharing scrolls focus to that banner so a user who hides the banner
// off-screen on a narrow window still has a reachable Stop control.

type Props = {
  onShareClick: () => void;
};

function formatMinutes(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function SharingIndicator({ onShareClick }: Props) {
  const { isSharing, nextExpiry } = useSharing();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isSharing) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [isSharing]);

  if (isSharing && nextExpiry) {
    const remaining = formatMinutes(nextExpiry.getTime() - now);
    return (
      <a
        href="#sharing-banner"
        className="flex items-center gap-2 rounded-full bg-alert-soft px-3 py-1 text-xs font-medium text-alert"
      >
        <span aria-hidden className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-alert" />
        </span>
        Sharing · {remaining}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onShareClick}
      className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-accent-fg"
    >
      <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
      Share location
    </button>
  );
}
