"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Action = (formData: FormData) => void | Promise<void>;
type Field = HTMLInputElement | HTMLTextAreaElement;

// Saves a second after the owner stops typing.
const AUTO_SAVE_DELAY_MS = 1000;

// A form that saves on its own. Each field saves when it loses focus, so tabbing from the
// price to the description saves the price. It also saves about a second after typing stops,
// and warns before leaving the page with unsaved edits.
export default function AutoSaveForm({
  action,
  className,
  children,
}: {
  action: Action;
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState(false);

  function fields(): Field[] {
    return Array.from(formRef.current?.querySelectorAll<Field>("input[name], textarea[name]") ?? []);
  }

  // Dirty = a field differs from the value the server last sent.
  function isDirty() {
    return fields().some((el) => el.value !== el.defaultValue);
  }

  function cancelTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  // Save anything that has changed. Safe to call when nothing has changed.
  function saveNow() {
    cancelTimer();
    if (isDirty()) formRef.current?.requestSubmit();
  }

  async function save(formData: FormData) {
    // Remember what was sent, so anything typed while the save runs stays marked as unsaved.
    const sent = fields().map((el) => [el, el.value] as const);
    await action(formData);
    sent.forEach(([el, value]) => {
      el.defaultValue = value;
    });
    setDirty(isDirty());
  }

  function onInput() {
    setDirty(isDirty());
    cancelTimer();
    timer.current = setTimeout(saveNow, AUTO_SAVE_DELAY_MS);
  }

  // Fires when focus leaves any field, so every field saves on its own.
  function onBlur() {
    saveNow();
  }

  useEffect(() => cancelTimer, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form ref={formRef} action={save} onBlur={onBlur} onInput={onInput} className={className}>
      {children}
      {/* Lets Enter in a field save too. Visually hidden, so the row stays clean. */}
      <button type="submit" className="sr-only">
        Save
      </button>
      <SaveStatus />
    </form>
  );
}

// Shows "Saving…" while the action runs, then "Saved" for a moment.
function SaveStatus() {
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
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [pending]);

  if (pending) return <span className="text-xs text-espresso/60">Saving…</span>;
  if (saved) return <span className="text-xs font-medium text-coffee">Saved ✓</span>;
  return null;
}
