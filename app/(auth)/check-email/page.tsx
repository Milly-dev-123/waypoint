import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const metadata = { title: 'Check your email — Waypoint' };

const isDev = process.env.NODE_ENV !== 'production';

export default function CheckEmailPage() {
  return (
    <Card className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Check your email</h1>
      <p className="text-sm text-fg">
        If an account exists for that address, we&rsquo;ve sent a one-time sign-in link. Open it
        on this device to continue.
      </p>
      {isDev && (
        <p className="rounded-md bg-accent-soft p-3 text-xs text-fg">
          <strong>Local dev:</strong> open{' '}
          <a
            href="http://127.0.0.1:54324"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent underline"
          >
            Inbucket
          </a>{' '}
          to read the magic-link email locally.
        </p>
      )}
      <p className="text-sm text-muted">
        Didn&rsquo;t get it? Check spam, then{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          request another link
        </Link>
        .
      </p>
    </Card>
  );
}
