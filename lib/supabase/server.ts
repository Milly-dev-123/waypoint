import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerEnv } from './env';

export async function createClient() {
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (read-only cookies). Safe to
          // ignore — middleware refreshes the session for the next request.
        }
      },
    },
  });
}
