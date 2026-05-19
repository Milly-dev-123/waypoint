// Shared empty-state copy for tabs whose content lands in a later
// milestone. Lets each tab be its own file (single responsibility)
// without duplicating the "coming soon" rendering.

export function Placeholder({ body }: { body: string }) {
  return <p className="text-sm text-muted">{body}</p>;
}
