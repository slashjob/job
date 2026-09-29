"use client";

import type { ReactNode } from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import Glyph from "@/components/Glyph";
import { MenuButton } from "@/components/Flyout";
import { Row } from "@/components/ui";

export type Option = { key: string; label: ReactNode; tone?: "grave"; icon?: ReactNode; onPick: () => void };

export function OptionsButton({ what, options }: { what: string | null; options: Option[] }) {
  return (
    <MenuButton quiet legend={`More for ${what ?? "this"}`} trigger={<Glyph icon={Ellipsis} />}>
      {options.map((option) => (
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
