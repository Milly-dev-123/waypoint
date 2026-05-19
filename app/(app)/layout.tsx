import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireProfile } from '@/lib/auth/guards';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Link href="/app" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span aria-hidden className="inline-block h-5 w-5 rounded-full border-2 border-accent" />
          Waypoint
        </Link>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-accent-soft hover:text-fg"
          >
            Sign out, {profile.display_name}
          </button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
