'use client';

import { X } from 'lucide-react';
import { TABS, type TabId } from '@/lib/app/tabs';
import { CirclesTab } from './tabs/CirclesTab';
import { Placeholder } from './tabs/Placeholder';

type NonMapTab = Exclude<TabId, 'map'>;

type Props = {
  tab: NonMapTab;
  onClose: () => void;
};

// Dispatcher: each tab becomes its own component as features land. Tabs
// that aren't built yet render a Placeholder describing what'll live
// here. z-[1100] sits above Leaflet's z-1000 controls so the LocateButton
// can't peek through an open panel on mobile.

const PLACEHOLDER_COPY: Record<Exclude<NonMapTab, 'circles'>, string> = {
  'public-pins': 'A map of community resources — water, food, shelter, hazards. Lands in milestone 2E.',
  activity: 'A transparency log of who has seen your location and what you’ve done. Lands in milestone 2F.',
  settings: 'Profile, stop-all sharing, and account deletion. Lands in milestone 2F.',
};

const HEADINGS: Record<NonMapTab, string> = {
  circles: 'Your circles',
  'public-pins': 'Public pins',
  activity: 'Activity',
  settings: 'Settings',
};

export function TabPanel({ tab, onClose }: Props) {
  const def = TABS.find((t) => t.id === tab);
  const heading = HEADINGS[tab];

  return (
    <aside
      aria-label={def?.label}
      className="absolute inset-x-0 bottom-0 top-0 z-[1100] flex flex-col bg-surface shadow-lift md:inset-y-0 md:left-0 md:right-auto md:w-[26rem] md:border-r md:border-border"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-semibold">{heading}</h2>
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
        {tab === 'circles' ? <CirclesTab /> : <Placeholder body={PLACEHOLDER_COPY[tab]} />}
      </div>
    </aside>
  );
}
