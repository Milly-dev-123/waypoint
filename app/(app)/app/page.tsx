import { AppShell } from '@/components/app/AppShell';
import { requireProfile } from '@/lib/auth/guards';

export const metadata = { title: 'Map' };

export default async function AppHome() {
  const profile = await requireProfile();
  return <AppShell profile={profile} />;
}
