"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Submit button for a form. Shows "Saving…" while the action runs, then "Saved ✓" for a moment,
// so there's a clear confirmation that the change went through.
export default function SaveButton({
  label,
  savedLabel = "Saved ✓",
  className,
}: {
  label: string;
  savedLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      setSaved(false);
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <span className="inline-flex items-center gap-3">
      <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
        {pending ? "Saving…" : label}
      </button>
      {saved && (
        <span role="status" className="text-sm font-semibold text-coffee">
          {savedLabel}
        </span>
      )}
    </span>
  );
}
