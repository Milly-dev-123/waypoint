'use client';

import { useActionState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { joinCircle } from '@/lib/circles/actions';
import { initialCircleFormState } from '@/lib/circles/form-state';

export function JoinCircleForm({ onJoined }: { onJoined: () => void }) {
  const [state, formAction] = useActionState(joinCircle, initialCircleFormState);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      detailsRef.current?.removeAttribute('open');
      onJoined();
    }
  }, [state, onJoined]);

  return (
    <details ref={detailsRef} className="group rounded-md border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent-soft">
        Join with a code
        <ChevronDown size={14} className="text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <form action={formAction} className="space-y-3 border-t border-border p-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="invite-code">Invite code</Label>
          <Input
            id="invite-code"
            name="inviteCode"
            type="text"
            required
            minLength={8}
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD1234"
            autoFocus
            className="font-mono uppercase tracking-widest"
          />
          <p className="text-xs text-muted">
            Ask someone in the circle for their 8-character code.
          </p>
        </div>
        {state.status === 'error' && <FormMessage tone="error">{state.message}</FormMessage>}
        <SubmitButton size="sm" className="w-full">
          Join circle
        </SubmitButton>
      </form>
    </details>
  );
}
