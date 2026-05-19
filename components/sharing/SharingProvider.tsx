'use client';

// Central state for active location sharing. Mounted near the root of
// the /app shell so the sharing state — and its 30-second write loop —
// survives tab switches inside the app.
//
// Reload-resume: on mount we fetch the user's active, unexpired shares.
// If any are still alive (e.g. the user navigated away and came back),
// the interval picks up where it left off. No prompt is shown unless
// the next geolocation read fails.
//
// Tab close: when the JS environment dies, the interval stops, but the
// DB row remains is_active until expires_at. The pg_cron job from
// migration 8 sweeps every 5 minutes. This is a known gap — Phase 3
// PWA + Background Sync can tighten it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { listMyActiveShares, recordLocationPoint } from '@/lib/sharing/queries';
import { startSharing as startSharingAction, stopSharing as stopSharingAction } from '@/lib/sharing/actions';
import type { ActiveShare, DurationMinutes } from '@/lib/sharing/types';

const TICK_MS = 30_000;

const HIGH_ACCURACY_OPTS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5_000,
};

type StartResult = { ok: true } | { ok: false; message: string };

type SharingContextValue = {
  shares: ActiveShare[];
  isSharing: boolean;
  nextExpiry: Date | null;
  start: (circleIds: string[], durationMinutes: DurationMinutes) => Promise<StartResult>;
  stop: () => Promise<void>;
};

const SharingContext = createContext<SharingContextValue | null>(null);

export function useSharing(): SharingContextValue {
  const ctx = useContext(SharingContext);
  if (!ctx) throw new Error('useSharing must be used inside <SharingProvider>');
  return ctx;
}

function pickNextExpiry(shares: ActiveShare[]): Date | null {
  if (shares.length === 0) return null;
  const ms = Math.min(...shares.map((s) => new Date(s.expires_at).getTime()));
  return new Date(ms);
}

export function SharingProvider({ children }: { children: ReactNode }) {
  const [shares, setShares] = useState<ActiveShare[]>([]);
  const intervalRef = useRef<number | null>(null);

  const nextExpiry = pickNextExpiry(shares);
  const isSharing = shares.length > 0 && nextExpiry !== null && nextExpiry.getTime() > Date.now();

  // Resume on mount.
  useEffect(() => {
    let cancelled = false;
    listMyActiveShares().then((next) => {
      if (!cancelled) setShares(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // While sharing, write a point every TICK_MS. Reads geolocation
  // anew each tick rather than watchPosition so we control timing.
  useEffect(() => {
    function clearTick() {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    if (!isSharing) {
      clearTick();
      return;
    }

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const result = await recordLocationPoint({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy ?? null,
          });
          // If the server rejected the write because no active share
          // exists (42501), our state is stale — re-sync.
          if (!result.ok && result.code === '42501') {
            const next = await listMyActiveShares();
            if (!cancelled) setShares(next);
          }
        },
        (err) => {
          // Most likely PERMISSION_DENIED or timeout. We don't auto-stop
          // shares here; the user may grant permission later. Banner stays
          // visible and the user can stop manually.
          console.warn('[sharing] geolocation tick failed', err.code, err.message);
        },
        HIGH_ACCURACY_OPTS,
      );
    }

    // Immediate first tick so we don't wait 30s for the first point.
    tick();
    intervalRef.current = window.setInterval(tick, TICK_MS);

    return () => {
      cancelled = true;
      clearTick();
    };
  }, [isSharing]);

  // Force a re-render when the earliest share expires, so isSharing
  // flips false without needing a server round-trip.
  useEffect(() => {
    if (!nextExpiry) return;
    const ms = Math.max(0, nextExpiry.getTime() - Date.now());
    const handle = setTimeout(() => {
      // Refetch — cron may have already marked rows inactive.
      listMyActiveShares().then(setShares);
    }, ms + 500);
    return () => clearTimeout(handle);
  }, [nextExpiry]);

  const start = useCallback(
    async (circleIds: string[], durationMinutes: DurationMinutes): Promise<StartResult> => {
      // Request geolocation permission BEFORE writing any share rows,
      // so a denial leaves no dangling DB state.
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            reject(new Error('Geolocation not supported in this browser.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, HIGH_ACCURACY_OPTS);
        });
      } catch {
        return {
          ok: false,
          message: 'Location permission denied. Allow access in your browser to share.',
        };
      }

      const result = await startSharingAction(circleIds, durationMinutes);
      if (result.status === 'error') {
        return { ok: false, message: result.message };
      }

      setShares(result.shares);
      return { ok: true };
    },
    [],
  );

  const stop = useCallback(async () => {
    await stopSharingAction();
    setShares([]);
  }, []);

  return (
    <SharingContext.Provider value={{ shares, isSharing, nextExpiry, start, stop }}>
      {children}
    </SharingContext.Provider>
  );
}
