"use client";

import { Command } from "@/components/act";
import { useDock } from "@/components/Dock";
import { Button, Tip } from "@/components/ui";
import { describes } from "@/lib/actions";

export default function Actions({ ids, argument = "" }: { ids: string[]; argument?: string }) {
  const { draft } = useDock();

  if (ids.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <Tip key={id} tip={describes(id)}>
          <Button onClick={() => draft(id, argument)}>
            <Command id={id} />
          </Button>
        </Tip>
      ))}
    </div>
  );
}
