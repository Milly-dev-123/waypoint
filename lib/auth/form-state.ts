// Shared types + constants for the auth form server actions.
// Kept out of actions.ts because a 'use server' module can only export
// async functions — exporting a plain object or type from a server-action
// file is a Next.js compile error.

export type FormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialFormState: FormState = { status: 'idle' };
