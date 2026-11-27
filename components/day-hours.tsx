"use client";

import { useState } from "react";
import { adminInput } from "@/components/admin-nav";

// One weekday row in the hours form. Ticking Closed greys out the time pickers.
export default function DayHours({
  weekday,
  label,
  closed: initialClosed,
  opens,
  closes,
}: {
  weekday: number;
  label: string;
  closed: boolean;
  opens: string;
  closes: string;
}) {
  const [closed, setClosed] = useState(initialClosed);

  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3 rounded-xl bg-white/60 p-3">
      <div>
        <p className="font-medium">{label}</p>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={`closed_${weekday}`}
            checked={closed}
            onChange={(e) => setClosed(e.target.checked)}
            className="h-4 w-4"
          />
          Closed
        </label>
      </div>
      <div className={`grid grid-cols-2 gap-2 transition-opacity ${closed ? "opacity-40" : ""}`}>
        <input
          type="time"
          name={`opens_${weekday}`}
          defaultValue={opens}
          disabled={closed}
          aria-label={`${label} opens`}
          className={`${adminInput} disabled:cursor-not-allowed disabled:bg-latte/50`}
        />
        <input
          type="time"
          name={`closes_${weekday}`}
          defaultValue={closes}
          disabled={closed}
          aria-label={`${label} closes`}
          className={`${adminInput} disabled:cursor-not-allowed disabled:bg-latte/50`}
        />
      </div>
    </div>
  );
}
