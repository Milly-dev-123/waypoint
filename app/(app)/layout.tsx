import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/guards';

// All routes under (app) require a signed-in user. requireUser() redirects
// to /login if there's no session. The page itself fetches the profile
// (one DB call total per /app render) and renders the AppShell chrome.

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
