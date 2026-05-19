'use client';

import { useState } from 'react';
import { TopBar } from './TopBar';
import { TabNav } from './TabNav';
import { TabPanel } from './TabPanel';
import { FloatingActionButton } from './FloatingActionButton';
import { MapClientOnly } from '@/components/map/MapClientOnly';
import type { Profile } from '@/lib/auth/guards';
import type { TabId } from '@/lib/app/tabs';

// Root of the /app experience. Map renders as the persistent backdrop;
// non-map tabs open as an overlay panel (bottom sheet on mobile, side
// drawer on desktop) without unmounting the map.

export function AppShell({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<TabId>('map');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
      <TopBar profile={profile} />
      <div className="relative flex flex-1 flex-col-reverse md:flex-row">
        <TabNav active={activeTab} onChange={setActiveTab} />
        <main className="relative flex-1">
          <MapClientOnly />
          {activeTab !== 'map' && (
            <TabPanel tab={activeTab} onClose={() => setActiveTab('map')} />
          )}
          {activeTab === 'map' && <FloatingActionButton />}
        </main>
      </div>
    </div>
  );
}
