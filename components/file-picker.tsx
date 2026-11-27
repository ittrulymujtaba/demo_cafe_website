"use client";

import { useState } from "react";

// Longest side, in pixels, that photos are shrunk to before upload.
const MAX_SIDE_PX = 2000;
// Photos under this size that are already small enough are sent as they are.
const SKIP_RESIZE_BYTES = 1.5 * 1024 * 1024;

// Shrinks a phone photo to MAX_SIDE_PX and re-encodes it as JPEG, so café wifi isn't
// uploading 8 MB camera files. Falls back to the original file if the browser can't decode it.
async function shrink(file: File): Promise<File> {
  if (file.size <= SKIP_RESIZE_BYTES && file.type !== "image/heic") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // White behind the photo, so transparent PNGs don't turn black when saved as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// A file input styled as a button, with the chosen file's name beside it.
// Photos are shrunk in the browser before they're sent.
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
  const [working, setWorking] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const original = input.files?.[0];
    if (!original) {
      setFileName("");
      return;
    }

    setWorking(true);
    const smaller = await shrink(original);
    if (smaller !== original) {
      // Swap the input's file for the smaller copy, so the form submits that one.
      const transfer = new DataTransfer();
      transfer.items.add(smaller);
      input.files = transfer.files;
    }
    setFileName(smaller.name);
    setWorking(false);
  }

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
          onChange={onChange}
        />
      </label>
      <span className="max-w-[16rem] truncate text-sm text-espresso/70">
        {working ? "Resizing…" : fileName || "No file chosen"}
      </span>
    </div>
  );
}
