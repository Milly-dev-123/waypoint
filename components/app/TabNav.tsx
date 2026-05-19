'use client';

import { TABS, type TabId } from '@/lib/app/tabs';
import { cn } from '@/lib/utils/cn';

// Mobile: full-width bottom bar with icons + labels.
// Desktop (md+): narrow left rail with icon + label stacked.

type Props = {
  active: TabId;
  onChange: (id: TabId) => void;
};

export function TabNav({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Primary"
      className="z-30 flex shrink-0 items-stretch justify-around border-t border-border bg-surface md:w-20 md:flex-col md:justify-start md:gap-1 md:border-r md:border-t-0 md:py-3"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition md:flex-none md:py-2.5',
              isActive ? 'text-accent' : 'text-muted hover:text-fg',
            )}
          >
            <Icon size={20} aria-hidden />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
