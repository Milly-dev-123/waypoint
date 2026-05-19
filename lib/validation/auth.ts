import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a display name.')
  .max(40, 'Display names are limited to 40 characters.');

export const loginSchema = z.object({
  email: emailSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 13 or older.' }),
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;
