'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { createCircleSchema, joinCircleSchema } from './schema';
import type { CircleFormState } from './form-state';

// Map known Postgres SQLSTATE codes raised by the join_circle RPC to
// user-facing messages. We do NOT leak the raw codes to the client.
const JOIN_ERROR_COPY: Record<string, string> = {
  '22023': 'That invite code doesn’t match any circle.',
  '53400': 'You’ve joined too many circles in the last hour. Try again later.',
  '28000': 'You need to be signed in to join a circle.',
};

// Map known Postgres SQLSTATE codes raised by the create_circle RPC to
// user-facing messages. We do NOT leak the raw codes to the client.
const CREATE_ERROR_COPY: Record<string, string> = {
  '22023': 'That name doesn’t work. Use 1–60 characters.',
  '53400': 'Couldn’t find a free invite code. Please try again.',
  '28000': 'You need to be signed in to create a circle.',
};

export async function createCircle(
  _prev: CircleFormState,
  formData: FormData,
): Promise<CircleFormState> {
  await requireUser();
  const parsed = createCircleSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid name' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_circle', { _name: parsed.data.name });

  if (error) {
    console.error('[createCircle] rpc failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      status: 'error',
      message: CREATE_ERROR_COPY[error.code ?? ''] ?? 'Couldn’t create the circle.',
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath('/app');
  return { status: 'success', circleId: row?.id };
}

export async function joinCircle(
  _prev: CircleFormState,
  formData: FormData,
): Promise<CircleFormState> {
  await requireUser();
  const parsed = joinCircleSchema.safeParse({ inviteCode: formData.get('inviteCode') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid code' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('join_circle', {
    _invite_code: parsed.data.inviteCode,
  });

  if (error) {
    return {
      status: 'error',
      message: JOIN_ERROR_COPY[error.code ?? ''] ?? 'Couldn’t join the circle.',
    };
  }

  revalidatePath('/app');
  return { status: 'success', circleId: data };
}

// Direct-call action (not useActionState). The DB trigger
// cleanup_empty_circle handles deleting the circle if this was the
// last member, so callers don't need to do that separately.
export async function leaveCircle(circleId: string): Promise<CircleFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('user_id', user.id);

  if (error) {
    return { status: 'error', message: 'Couldn’t leave the circle.' };
  }

  revalidatePath('/app');
  return { status: 'success' };
}
