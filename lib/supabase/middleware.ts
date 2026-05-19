import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getServerEnv } from './env';

/**
 * Refresh the Supabase session cookie on every request. Without this the
 * session silently expires on a long-lived tab and the next server-render
 * looks unauthenticated.
 */
export async function updateSession(request: NextRequest) {
  const env = getServerEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the user so the SDK refreshes & re-sets the cookie if needed.
  await supabase.auth.getUser();

  return response;
}
