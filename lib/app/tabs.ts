// Tab definitions for the /app shell. Single source of truth so TabNav,
// TabPanel, and any deep-link logic stay aligned.

import { Activity, Map as MapIcon, MapPin, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabId = 'map' | 'circles' | 'public-pins' | 'activity' | 'settings';

export type TabDef = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

export const TABS: ReadonlyArray<TabDef> = [
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'circles', label: 'Circles', icon: Users },
  { id: 'public-pins', label: 'Public Pins', icon: MapPin },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];
