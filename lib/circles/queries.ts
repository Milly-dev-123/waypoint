'use client';

// Browser-side reads. RLS gates every row — we never receive circles or
// members the caller isn't entitled to see — so we don't re-check
// authorisation here. Server actions handle writes.

import { createClient } from '@/lib/supabase/client';
import type { CircleSummary, CircleMember, CircleRole } from './types';

export async function listMyCircles(): Promise<CircleSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at, circle_members(count)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    invite_code: row.invite_code,
    created_at: row.created_at,
    member_count: row.circle_members?.[0]?.count ?? 0,
  }));
}

export async function getCircle(circleId: string): Promise<CircleSummary | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('circles')
    .select('id, name, invite_code, created_at, circle_members(count)')
    .eq('id', circleId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    invite_code: data.invite_code,
    created_at: data.created_at,
    member_count: data.circle_members?.[0]?.count ?? 0,
  };
}

// circle_members.user_id FKs auth.users not profiles, so PostgREST can't
// auto-join — we run two queries and merge. Cheap: a circle is a small
// group, at most a couple of dozen members.
export async function listCircleMembers(circleId: string): Promise<CircleMember[]> {
  const supabase = createClient();

  const { data: members, error } = await supabase
    .from('circle_members')
    .select('user_id, role, joined_at')
    .eq('circle_id', circleId)
    .order('joined_at', { ascending: true });

  if (error || !members?.length) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in(
      'id',
      members.map((m) => m.user_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const profile = byId.get(m.user_id);
    return {
      user_id: m.user_id,
      role: m.role as CircleRole,
      joined_at: m.joined_at,
      display_name: profile?.display_name ?? 'Unknown',
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}
