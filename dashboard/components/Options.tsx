"use client";

import type { ReactNode } from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import { useShownAction } from "@/components/Actions";
import { Command } from "@/components/act";
import { useDock } from "@/components/Dock";
import Glyph from "@/components/Glyph";
import { MenuButton } from "@/components/Flyout";
import { Row } from "@/components/ui";

export type Option = {
  key: string;
  label: ReactNode;
  tone?: "grave";
  icon?: ReactNode;
  action?: { id: string; argument: string };
  onPick: () => void;
};

export function useActionOption() {
  const { draft } = useDock();
  return (id: string, argument: string): Option => ({
    key: id,
    label: <Command id={id} />,
    action: { id, argument },
    onPick: () => draft(id, argument),
  });
}

export function OptionsButton({ what, options }: { what: string | null; options: Option[] }) {
  const shown = useShownAction();
  const offered = options.filter((option) => !option.action || !shown(option.action.id, option.action.argument));
  if (!offered.length) return null;
  return (
    <MenuButton legend={`More for ${what ?? "this"}`} trigger={<Glyph icon={Ellipsis} />}>
      {offered.map((option) => (
        <Row
          key={option.key}
          role="menuitem"
          tone={option.tone === "grave" ? "grave" : "quiet"}
          className="flex items-center gap-2"
          onClick={option.onPick}
        >
          {option.icon}
          {option.label}
        </Row>
      ))}
    </MenuButton>
  );
}
export const deleteOption = (label: string, onPick: () => void): Option => ({
  key: "delete",
  label,
  tone: "grave",
  icon: <Glyph icon={Trash2} size="sm" />,
  onPick,
});

export const DeleteMenu = ({ what, label, onPick }: { what: string | null; label: string; onPick: () => void }) => (
  <OptionsButton what={what} options={[deleteOption(label, onPick)]} />
);
