import { Card } from '@/components/ui/Card';
import { requireProfile } from '@/lib/auth/guards';

export const metadata = { title: 'Home' };

export default async function AppHome() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">
          Welcome, {profile.display_name}.
        </h1>
        <p className="text-muted">
          Auth and the schema are live. The map, circles, and pin features land next.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-semibold">What&rsquo;s working</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-fg">
          <li>Magic-link sign-up with required age confirmation.</li>
          <li>Magic-link sign-in (no passwords stored anywhere).</li>
          <li>Full database schema with row-level security on every table.</li>
          <li>Audit log for who saw whose location, viewable per user.</li>
          <li>Cron jobs that purge location points after 24 hours.</li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Coming next (Phase 2)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Map (react-leaflet, OSM tiles in dev).</li>
          <li>Circles: create / invite / join / leave.</li>
          <li>Time-bounded location sharing with a persistent banner.</li>
          <li>Circle pins and public humanitarian pins.</li>
          <li>Realtime updates and the Activity tab.</li>
        </ul>
      </Card>
    </div>
  );
}
