"use client";

import { downloadUserData } from "@/lib/exportData";

export default function ExportDataButton({ email }: { email: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadUserData(email)}
      className="eq-btn eq-btn-ghost text-sm"
    >
      ⬇ Export my data
    </button>
  );
}
