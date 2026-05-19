import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-semibold">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-full border-2 border-accent"
          />
          Waypoint
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
