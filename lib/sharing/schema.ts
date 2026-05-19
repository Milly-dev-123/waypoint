import { z } from 'zod';
import { DURATIONS_MINUTES, type DurationMinutes } from './types';

const durationSchema = z
  .number()
  .int()
  .refine(
    (v): v is DurationMinutes => (DURATIONS_MINUTES as readonly number[]).includes(v),
    'Pick a duration',
  );

export const startSharingSchema = z.object({
  circleIds: z
    .array(z.string().uuid('That doesn’t look like a circle'))
    .min(1, 'Pick at least one circle'),
  durationMinutes: durationSchema,
});

export const locationPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().nonnegative().nullable(),
});
