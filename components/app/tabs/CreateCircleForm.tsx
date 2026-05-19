'use client';

import { useActionState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { createCircle } from '@/lib/circles/actions';
import { initialCircleFormState } from '@/lib/circles/form-state';

export function CreateCircleForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction] = useActionState(createCircle, initialCircleFormState);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      detailsRef.current?.removeAttribute('open');
      onCreated();
    }
  }, [state, onCreated]);

  return (
    <details ref={detailsRef} className="group rounded-md border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent-soft">
        Create a circle
        <ChevronDown size={14} className="text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <form action={formAction} className="space-y-3 border-t border-border p-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="circle-name">Circle name</Label>
          <Input
            id="circle-name"
            name="name"
            type="text"
            required
            maxLength={60}
            autoFocus
            placeholder="e.g. Family"
          />
        </div>
        {state.status === 'error' && <FormMessage tone="error">{state.message}</FormMessage>}
        <SubmitButton size="sm" className="w-full">
          Create circle
        </SubmitButton>
      </form>
    </details>
  );
}
