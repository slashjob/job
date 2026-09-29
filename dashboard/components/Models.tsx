"use client";

import { Dot, Row } from "@/components/ui";
import type { Model } from "@/lib/queries";

export default function Models({
  models,
  model,
  note,
  onPick,
}: {
  models: Model[];
  model: string;
  note?: string;
  onPick: (key: string) => void;
}) {
  return (
    <>
      <h2 className={`eyebrow px-3 ${note ? "" : "pb-1"}`}>Model</h2>
      {note && <p className="px-3 pb-1 pt-0.5 text-micro text-soft">{note}</p>}
      {models.map((choice) => {
        const on = model === choice.key;
        return (
          <Row
            key={choice.key}
            role="menuitemradio"
            aria-checked={on}
            onClick={() => onPick(choice.key)}
            className={`flex items-center gap-2 ${on ? "font-medium text-base-content" : "text-soft"}`}
          >
            <Dot tone={on ? "signal" : "none"} />
            {choice.label}
          </Row>
        );
      })}
    </>
  );
}
