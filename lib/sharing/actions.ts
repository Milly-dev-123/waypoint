'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { startSharingSchema } from './schema';
import type { ActiveShare } from './types';

export type StartResult =
  | { status: 'success'; shares: ActiveShare[] }
  | { status: 'error'; message: string };

export type StopResult =
  | { status: 'success'; count: number }
  | { status: 'error'; message: string };

const START_ERROR_COPY: Record<string, string> = {
  '22023': 'That selection isn’t valid.',
  '42501': 'You must be a member of every circle you share to.',
  '28000': 'You need to be signed in to share your location.',
};

export async function startSharing(
  circleIds: string[],
  durationMinutes: number,
): Promise<StartResult> {
  await requireUser();
  const parsed = startSharingSchema.safeParse({ circleIds, durationMinutes });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('start_location_share', {
    _circle_ids: parsed.data.circleIds,
    _duration_minutes: parsed.data.durationMinutes,
  });

  if (error) {
    console.error('[startSharing] rpc failed', {
      code: error.code,
      message: error.message,
    });
    return {
      status: 'error',
      message: START_ERROR_COPY[error.code ?? ''] ?? 'Couldn’t start sharing.',
    };
  }

  return { status: 'success', shares: (data ?? []) as ActiveShare[] };
}

export async function stopSharing(): Promise<StopResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('stop_location_shares');

  if (error) {
    console.error('[stopSharing] rpc failed', {
      code: error.code,
      message: error.message,
    });
    return { status: 'error', message: 'Couldn’t stop sharing.' };
  }

  return { status: 'success', count: (data as number | null) ?? 0 };
}
