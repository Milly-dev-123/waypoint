'use client';

import { useState, type RefObject } from 'react';
import type L from 'leaflet';
import { LocateFixed } from 'lucide-react';

// Explicit, user-initiated geolocation. We never auto-locate; the user
// must press this button each session for the browser permission prompt
// to fire. This matches Waypoint's consent posture.

type Props = {
  mapRef: RefObject<L.Map | null>;
};

export function LocateButton({ mapRef }: Props) {
  const [state, setState] = useState<'idle' | 'locating' | 'denied' | 'error'>('idle');

  function handleClick() {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) {
      setState('error');
      return;
    }
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        setState('idle');
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30_000 },
    );
  }

  const title =
    state === 'denied'
      ? 'Location permission denied — enable it in your browser settings'
      : state === 'error'
        ? "Couldn't get your location"
        : 'Centre map on my location';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'locating'}
      title={title}
      aria-label={title}
      className="absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg shadow-soft transition hover:bg-accent-soft disabled:cursor-progress disabled:opacity-60"
    >
      <LocateFixed size={18} aria-hidden />
    </button>
  );
}
