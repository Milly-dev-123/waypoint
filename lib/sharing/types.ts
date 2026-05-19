// Shared types for the location-sharing feature.

// A peer's most recently recorded position, joined with their display
// name. Returned by latest_visible_positions(). Only includes users
// the viewer can see by RLS — see can_see_location().
export type VisiblePosition = {
  user_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  recorded_at: string;
  display_name: string | null;
};

export type ActiveShare = {
  id: string;
  user_id: string;
  circle_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
};

// The four durations the spec — and DB RPC — accept. No other values
// are valid; the picker offers exactly these.
export const DURATIONS_MINUTES = [15, 60, 240, 1440] as const;
export type DurationMinutes = (typeof DURATIONS_MINUTES)[number];

export const DURATION_LABELS: Record<DurationMinutes, string> = {
  15: '15 minutes',
  60: '1 hour',
  240: '4 hours',
  1440: '24 hours',
};
