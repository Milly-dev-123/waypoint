import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = { title: 'Create account — Waypoint' };

export default function SignupPage() {
  return (
    <Card className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted">
          Waypoint is consent-first. You decide who sees your location, and for how long.
        </p>
      </div>

      <SignupForm />

      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
