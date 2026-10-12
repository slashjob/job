"use client";

import type { RefObject } from "react";

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
  clears,
  onPick,
}: {
  working: boolean;
  waiting: boolean;
  clears: RefObject<HTMLElement | null>;
  onPick: (id: string) => void;
}) {
  return (
    <MenuButton
      size="broad"
      clears={clears}
      tone="mark"
      className="h-[var(--dock-row)] shrink-0"
      legend={waiting ? "Job actions, waiting on you" : "Job actions"}
      trigger={<Wordmark size={15} working={working} waiting={waiting} />}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)]">
        {ACTIONS.map(({ id, does }) => (
          <Row
            key={id}
            role="menuitem"
            onClick={() => onPick(id)}
            className="col-span-2 grid grid-cols-subgrid items-baseline gap-x-4"
          >
            <span className="text-sm">
              <Command id={id} />
            </span>
            <span className="truncate text-soft">{does}</span>
          </Row>
        ))}
      </div>
    </MenuButton>
  );
}
