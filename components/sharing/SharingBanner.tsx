'use client';

// The persistent, unhideable alert when sharing is active. The only
// "alert-coloured" UI in the app — bright enough that you can't forget
// it's on. One tap on Stop ends every active share.

import { useEffect, useState } from 'react';
import { useSharing } from './SharingProvider';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hours}h ${rem}m`;
  }
  if (minutes >= 1) return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function SharingBanner() {
  const { isSharing, nextExpiry, shares, stop } = useSharing();
  const [stopping, setStopping] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick the countdown.
  useEffect(() => {
    if (!isSharing) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [isSharing]);

  if (!isSharing || !nextExpiry) return null;

  const circleCount = shares.length;
  const remaining = formatRemaining(nextExpiry.getTime() - now);

  async function handleStop() {
    if (!confirm('Stop sharing your location now?')) return;
    setStopping(true);
    try {
      await stop();
    } finally {
      setStopping(false);
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="z-50 flex items-center justify-between gap-3 bg-alert px-4 py-2.5 text-alert-fg shadow-soft"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert-fg opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-alert-fg" />
        </span>
        <span className="text-sm font-medium">
          Sharing with {circleCount} {circleCount === 1 ? 'circle' : 'circles'} · ends in {remaining}
        </span>
      </div>
      <button
        type="button"
        onClick={handleStop}
        disabled={stopping}
        className="rounded-md bg-alert-fg/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-alert-fg/25 disabled:opacity-60"
      >
        {stopping ? 'Stopping…' : 'Stop sharing'}
      </button>
    </div>
  );
}
