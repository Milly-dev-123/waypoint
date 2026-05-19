import { z } from 'zod';

// Circle name: 1–60 chars (matches the DB check on circles.name).
export const circleNameSchema = z
  .string()
  .trim()
  .min(1, 'Give your circle a name')
  .max(60, 'Keep it under 60 characters');

// 8-char Crockford base-32, excluding look-alike 0/O/1/I/L (matches the
// DB check on circles.invite_code). User input is normalised to upper.
export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(8, 'Invite codes are 8 characters')
  .regex(/^[0-9A-HJKMNP-TV-Z]+$/, 'That code contains characters we don’t use');

export const createCircleSchema = z.object({
  name: circleNameSchema,
});

export const joinCircleSchema = z.object({
  inviteCode: inviteCodeSchema,
});
