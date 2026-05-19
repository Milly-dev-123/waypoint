import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SAFE_NEXT = /^\/[A-Za-z0-9/_\-?=&%.]*$/;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/app';
  // Defence against open-redirect: only follow same-origin paths.
  const next = SAFE_NEXT.test(nextParam) ? nextParam : '/app';

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
