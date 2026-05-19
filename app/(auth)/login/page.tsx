import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';

export const metadata = { title: 'Sign in — Waypoint' };

export default function LoginPage() {
  return (
    <Card className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted">Sign in with a one-time link to your email.</p>
      </div>

      <MagicLinkForm />

      <p className="text-sm text-muted">
        New to Waypoint?{' '}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
