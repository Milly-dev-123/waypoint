// Shared state shape for circle form server actions. Kept out of
// actions.ts because a 'use server' module can only export async
// functions — exporting a type or constant from one is a Next.js
// compile error.

export type CircleFormState =
  | { status: 'idle' }
  | { status: 'success'; circleId?: string }
  | { status: 'error'; message: string };

export const initialCircleFormState: CircleFormState = { status: 'idle' };
