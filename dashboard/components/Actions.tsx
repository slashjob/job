"use client";

import { Command } from "@/components/act";
import { useDock } from "@/components/Dock";
import { MenuButton } from "@/components/Flyout";
import Wordmark from "@/components/Wordmark";
import { Button, Row, Tip } from "@/components/ui";
import { ACTIONS, describes } from "@/lib/actions";

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

export function ActionsMenu({
  working,
  waiting,
  onPick,
}: {
  working: boolean;
  waiting: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <MenuButton
      wide
      tone="mark"
      className="h-[var(--dock-row)] shrink-0"
      legend={waiting ? "Job actions, waiting on you" : "Job actions"}
      trigger={<Wordmark size={15} working={working} waiting={waiting} />}
    >
      {ACTIONS.map(({ id, does }) => (
        <Row key={id} role="menuitem" roomy onClick={() => onPick(id)}>
          <Command id={id} />
          <span className="block text-xs text-soft">{does}</span>
        </Row>
      ))}
    </MenuButton>
  );
}
