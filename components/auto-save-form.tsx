"use client";

import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Action = (formData: FormData) => void | Promise<void>;

// A form that saves itself when focus leaves it, so changing three prices and tapping
// away from each one saves all three. It also warns before leaving the page with unsaved edits.
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
  const [dirty, setDirty] = useState(false);

  // Dirty = any field differs from the value the server last sent.
  function isDirty() {
    const form = formRef.current;
    if (!form) return false;
    return Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]"),
    ).some((el) => el.value !== el.defaultValue);
  }

  // After a successful save, make the current values the new baseline.
  function markClean() {
    formRef.current
      ?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]")
      .forEach((el) => {
        el.defaultValue = el.value;
      });
    setDirty(false);
  }

  async function save(formData: FormData) {
    await action(formData);
    markClean();
  }

  // Leaving the whole form (not just moving between its fields) triggers a save.
  function onBlur(e: FocusEvent<HTMLFormElement>) {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (isDirty()) formRef.current?.requestSubmit();
    setDirty(false);
  }

  function onInput() {
    setDirty(isDirty());
  }

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
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [pending]);

  if (pending) return <span className="text-xs text-espresso/60">Saving…</span>;
  if (saved) return <span className="text-xs font-medium text-coffee">Saved ✓</span>;
  return null;
}
