'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/supabase/env';
import { loginSchema, signupSchema } from '@/lib/validation/auth';
import type { FormState } from './form-state';

export async function requestMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid email.' };
  }

  const env = getServerEnv();
  const supabase = await createClient();

  // shouldCreateUser=false here: this form is for existing accounts. A new
  // user must go through /signup first (so display_name + age confirmation
  // are captured). We intentionally don't reveal whether the address has an
  // account, to avoid an enumeration oracle.
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/app`,
      shouldCreateUser: false,
    },
  });

  redirect('/check-email');
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    displayName: formData.get('displayName'),
    ageConfirmed: formData.get('ageConfirmed') === 'on',
  });
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
    };
  }

  const env = getServerEnv();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/app`,
      shouldCreateUser: true,
      data: {
        display_name: parsed.data.displayName,
        age_confirmed_at: new Date().toISOString(),
      },
    },
  });
  if (error) {
    return { status: 'error', message: "We couldn't send the link. Please try again." };
  }

  redirect('/check-email');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
