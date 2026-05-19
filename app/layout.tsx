import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { cn } from '@/lib/utils/cn';
import './globals.css';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Waypoint', template: '%s · Waypoint' },
  description:
    'Consent-first location sharing for the people you trust, plus a community map of places and services.',
  applicationName: 'Waypoint',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1116' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(fontBody.variable, fontDisplay.variable)}>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
