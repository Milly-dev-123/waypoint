'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window` on module load, so the Map component must be
// excluded from server rendering. next/dynamic with ssr:false defers the
// import to the browser and shows a quiet placeholder during hydration.

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-bg text-sm text-muted">
      Loading map…
    </div>
  ),
});

export function MapClientOnly() {
  return <Map />;
}
