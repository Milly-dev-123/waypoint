'use client';

// Browser-side sharing IO. listMyActiveShares is a plain RLS-gated
// SELECT; recordLocationPoint is the only sanctioned write path for
// location_points and is called from the 30s tick inside
// SharingProvider. Both run as the user via cookies → JWT → PostgREST.

import { createClient } from '@/lib/supabase/client';
import type { ActiveShare } from './types';

export async function listMyActiveShares(): Promise<ActiveShare[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('location_shares')
    .select('id, user_id, circle_id, started_at, expires_at, is_active')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (error || !data) return [];
  return data as ActiveShare[];
}

type RecordResult = { ok: true } | { ok: false; code?: string; message: string };

export async function recordLocationPoint(args: {
  lat: number;
  lng: number;
  accuracyM: number | null;
}): Promise<RecordResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc('record_location_point', {
    _lat: args.lat,
    _lng: args.lng,
    _accuracy_m: args.accuracyM,
  });
  if (error) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: true };
}
