// Shared types for the Circles feature. Isomorphic — imported from both
// server actions and client components.

export type CircleRole = 'owner' | 'member';

export type CircleSummary = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  member_count: number;
};

export type CircleMember = {
  user_id: string;
  role: CircleRole;
  joined_at: string;
  display_name: string;
  avatar_url: string | null;
};
