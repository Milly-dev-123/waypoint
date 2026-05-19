import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type SessionUser = {
  id: string;
  email: string | null;
};

/**
 * For use in protected layouts/pages. Redirects to /login if no session.
 */
export async function requireUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  return { id: user.id, email: user.email ?? null };
}

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

/**
 * Returns the signed-in user's profile row, redirecting if either auth or
 * the profile is missing (the profile is normally created by the
 * on_auth_user_created trigger).
 */
export async function requireProfile(): Promise<Profile> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', user.id)
    .single();
  if (error || !data) {
    redirect('/login');
  }
  return data;
}
