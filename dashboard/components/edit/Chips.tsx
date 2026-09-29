"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { remove, save } from "@/lib/edit";
import { answered, reported } from "./answered";
import { X } from "lucide-react";
import Glyph from "@/components/Glyph";
import { Ghost } from "@/components/ui";

export default function Chips({
  table,
  column,
  rows,
  seed = {},
  placeholder,
}: {
  table: string;
  column: string;
  rows: ({ rowid: number } & Record<string, unknown>)[];
  seed?: Record<string, string>;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const router = useRouter();

  const act = async (result: Awaited<ReturnType<typeof save>>) => {
    if (reported(result)) return;
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {rows.map((row) => (
        <span
          key={row.rowid}
          className="inline-flex items-center gap-1 rounded-full bg-base-200 py-0.5 pl-2.5 pr-1 text-xs"
        >
          {String(row[column])}
          <Ghost
            tight
            aria-label={`Remove ${String(row[column])}`}
            onClick={async () => act(await answered(remove(table, row.rowid)))}
            icon={<Glyph icon={X} size="sm" />}
          />
        </span>
      ))}
      <input
        className="quietbox w-40 text-xs"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={async (event) => {
          if (event.key !== "Enter" || !draft.trim()) return;
          event.preventDefault();
          const value = draft.trim();
          setDraft("");
          act(await answered(save(table, null, { ...seed, [column]: value })));
        }}
      />
    </div>
  );
}
