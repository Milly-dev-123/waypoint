'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import type { Profile } from '@/lib/auth/guards';

// Native <details>/<summary> for the disclosure — keyboard accessible
// without a useState dance. The only item inside is a sign-out form
// which navigates away, so we don't need outside-click-to-close yet.

export function UserMenu({ profile }: { profile: Profile }) {
  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent-soft focus:outline-none"
        aria-label="User menu"
      >
        <span className="font-medium">{profile.display_name}</span>
        <ChevronDown size={14} className="text-muted transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-surface p-1 shadow-lift">
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent-soft"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
