"use client";

import { ChevronDown } from "lucide-react";
import { Command } from "@/components/act";
import { useDeck } from "@/components/Deck";
import Glyph from "@/components/Glyph";
import { MenuButton } from "@/components/Flyout";
import { Button, Row, Tip } from "@/components/ui";
import { describes } from "@/lib/actions";

export default function Actions({ ids, argument = "" }: { ids: string[]; argument?: string }) {
  const { draft } = useDeck();

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

export function ActionsMenu({ ids }: { ids: string[] }) {
  const { draft } = useDeck();

  return (
    <MenuButton
      wide
      legend="Job actions"
      trigger={
        <>
          <Command id="all" />
          <Glyph icon={ChevronDown} size="sm" className="text-soft" />
        </>
      }
    >
      {ids.map((id) => (
        <Row key={id} role="menuitem" roomy onClick={() => draft(id, "")}>
          <Command id={id} />
          <span className="block text-xs text-soft">{describes(id)}</span>
        </Row>
      ))}
    </MenuButton>
  );
}
