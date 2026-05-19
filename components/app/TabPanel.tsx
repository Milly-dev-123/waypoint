'use client';

import { X } from 'lucide-react';
import { TABS, type TabId } from '@/lib/app/tabs';

// Phase 2A: each non-map tab renders a placeholder describing what
// will live here. Extracts into per-tab files as features land.

type Props = {
  tab: Exclude<TabId, 'map'>;
  onClose: () => void;
};

const PLACEHOLDERS: Record<Exclude<TabId, 'map'>, { heading: string; body: string }> = {
  circles: {
    heading: 'Your circles',
    body: 'Create or join a circle to share your location with people you trust. Coming next.',
  },
  'public-pins': {
    heading: 'Public pins',
    body: 'A map of community resources — water, food, shelter, hazards. Land in milestone 2E.',
  },
  activity: {
    heading: 'Activity',
    body: 'A transparency log of who has seen your location and what you’ve done. Land in milestone 2F.',
  },
  settings: {
    heading: 'Settings',
    body: 'Profile, stop-all sharing, and account deletion. Land in milestone 2F.',
  },
};

export function TabPanel({ tab, onClose }: Props) {
  const def = TABS.find((t) => t.id === tab);
  const placeholder = PLACEHOLDERS[tab];

  return (
    <aside
      // z-[1100] sits above Leaflet's control layer (z-1000) so the
      // LocateButton can't peek through an open panel on mobile.
      className="absolute inset-x-0 bottom-0 top-0 z-[1100] flex flex-col bg-surface shadow-lift md:inset-y-0 md:left-0 md:right-auto md:w-[26rem] md:border-r md:border-border"
      aria-label={def?.label}
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-semibold">{placeholder.heading}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1.5 text-muted hover:bg-accent-soft hover:text-fg"
        >
          <X size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-muted">{placeholder.body}</p>
      </div>
    </aside>
  );
}
