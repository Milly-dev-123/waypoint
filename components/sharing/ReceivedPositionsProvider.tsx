'use client';

// Live positions of peers the user is authorised to see. Seeds with
// latest_visible_positions(), then listens for INSERTs on
// location_points via Supabase Realtime and debounces a refetch on
// each burst. Realtime applies RLS, so we only receive events for
// rows we can SELECT (which writes to the audit log, throttled).
//
// A 60s poll runs alongside the realtime subscription as a fallback
// — if the websocket drops silently, the marker layer still updates
// within a minute. Removed on unmount.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchLatestPositions } from '@/lib/sharing/queries';
import type { VisiblePosition } from '@/lib/sharing/types';

const DEBOUNCE_MS = 300;
const POLL_MS = 60_000;

type ReceivedContextValue = {
  positions: VisiblePosition[];
};

const ReceivedContext = createContext<ReceivedContextValue | null>(null);

export function useReceivedPositions(): ReceivedContextValue {
  const ctx = useContext(ReceivedContext);
  if (!ctx) {
    throw new Error('useReceivedPositions must be used inside <ReceivedPositionsProvider>');
  }
  return ctx;
}

export function ReceivedPositionsProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<VisiblePosition[]>([]);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    function refetch() {
      fetchLatestPositions().then((next) => {
        if (!cancelled) setPositions(next);
      });
    }

    function scheduleRefetch() {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        refetch();
      }, DEBOUNCE_MS);
    }

    refetch();

    const supabase = createClient();
    const channel = supabase
      .channel('location_points_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_points' },
        () => scheduleRefetch(),
      )
      .subscribe();

    const pollHandle = window.setInterval(refetch, POLL_MS);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(pollHandle);
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  return (
    <ReceivedContext.Provider value={{ positions }}>{children}</ReceivedContext.Provider>
  );
}
