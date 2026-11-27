"use client";

import { useState } from "react";

// A file input styled as a button, with the chosen file's name beside it.
export default function FilePicker({
  name,
  accept,
  buttonLabel,
  required,
}: {
  name: string;
  accept: string;
  buttonLabel: string;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState<string>("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-coffee px-4 py-2 text-sm font-semibold text-coffee hover:bg-coffee hover:text-cream focus-within:ring-2 focus-within:ring-coffee focus-within:ring-offset-2">
        {buttonLabel}
        <input
          type="file"
          name={name}
          accept={accept}
          required={required}
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>
      <span className="max-w-[16rem] truncate text-sm text-espresso/70">
        {fileName || "No file chosen"}
      </span>
    </div>
  );
}
