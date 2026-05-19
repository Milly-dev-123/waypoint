'use client';

import { SharingIndicator } from './SharingIndicator';
import { UserMenu } from './UserMenu';
import type { Profile } from '@/lib/auth/guards';

type Props = {
  profile: Profile;
  onShareClick: () => void;
};

export function TopBar({ profile, onShareClick }: Props) {
  return (
    <header className="z-40 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 font-display text-lg font-semibold">
        <span aria-hidden className="inline-block h-5 w-5 rounded-full border-2 border-accent" />
        Waypoint
      </div>
      <div className="flex items-center gap-3">
        <SharingIndicator onShareClick={onShareClick} />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
