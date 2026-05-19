'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (insecure context, old browser) — quiet fail.
      // The code is already select-all in the parent so the user can copy manually.
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      {copied ? (
        <>
          <Check size={14} aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} aria-hidden />
          Copy
        </>
      )}
    </Button>
  );
}
