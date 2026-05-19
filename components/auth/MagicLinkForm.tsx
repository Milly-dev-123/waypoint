'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { requestMagicLink } from '@/lib/auth/actions';
import { initialFormState } from '@/lib/auth/form-state';

export function MagicLinkForm() {
  const [state, formAction] = useActionState(requestMagicLink, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={state.status === 'error' || undefined}
        />
      </div>

      {state.status === 'error' && <FormMessage tone="error">{state.message}</FormMessage>}

      <SubmitButton className="w-full">Email me a sign-in link</SubmitButton>

      <p className="text-xs text-muted">
        We&rsquo;ll send a one-time link to that address. No password to remember.
      </p>
    </form>
  );
}
