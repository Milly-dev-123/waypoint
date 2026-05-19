'use client';

import { useState } from 'react';
import { TopBar } from './TopBar';
import { TabNav } from './TabNav';
import { TabPanel } from './TabPanel';
import { FloatingActionButton } from './FloatingActionButton';
import { MapClientOnly } from '@/components/map/MapClientOnly';
import { SharingProvider } from '@/components/sharing/SharingProvider';
import { SharingBanner } from '@/components/sharing/SharingBanner';
import { StartSharingModal } from '@/components/sharing/StartSharingModal';
import type { Profile } from '@/lib/auth/guards';
import type { TabId } from '@/lib/app/tabs';

// Root of the /app experience. Map is the persistent backdrop;
// non-map tabs open as an overlay panel without unmounting the map.
// SharingProvider owns the 30s write loop and active-share state so
// switching tabs doesn't disturb an active share.

export function AppShell({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <SharingProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
        <div id="sharing-banner">
          <SharingBanner />
        </div>
        <TopBar profile={profile} onShareClick={() => setShareModalOpen(true)} />
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
        <StartSharingModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />
      </div>
    </SharingProvider>
  );
}
