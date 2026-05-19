'use client';

import { Plus } from 'lucide-react';

// Phase 2A: visible no-op. Wires up to the pin-drop modal in 2E.
// Positioned to clear the mobile bottom nav (h-14 ≈ 56px → bottom-20).

export function FloatingActionButton() {
  return (
    <button
      type="button"
      onClick={() => {
        // TODO(2E): open circle vs public pin chooser
      }}
      aria-label="Drop a pin (coming soon)"
      className="absolute bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lift transition hover:brightness-105 active:scale-95 md:bottom-6"
    >
      <Plus size={26} aria-hidden />
    </button>
  );
}
