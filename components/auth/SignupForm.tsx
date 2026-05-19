'use client';

import { useActionState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormMessage } from '@/components/ui/FormMessage';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { signUp } from '@/lib/auth/actions';
import { initialFormState } from '@/lib/auth/form-state';

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          minLength={1}
          maxLength={40}
          required
        />
        <p className="text-xs text-muted">How your name appears to your circles.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-bg p-3 text-sm">
        <Checkbox name="ageConfirmed" required className="mt-0.5" />
        <span>
          I confirm I am <strong>13 or older</strong> and agree to use Waypoint only to share my
          own location with people I trust.
        </span>
      </label>

      {state.status === 'error' && <FormMessage tone="error">{state.message}</FormMessage>}

      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
