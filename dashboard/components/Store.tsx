"use client";

import { Copy, Database } from "lucide-react";

import { MenuButton } from "./Flyout";
import Glyph from "./Glyph";
import { say } from "./Toaster";
import { Ghost } from "@/components/ui";
import { byteSize } from "@/lib/format";
import type { Store as Facts } from "@/lib/store";

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3 py-1">
    <span className="text-xs text-soft">{label}</span>
    <span className="tnum text-xs">{value}</span>
  </div>
);

export default function Store({ store }: { store: Facts }) {
  const copy = () =>
    navigator.clipboard.writeText(store.path).then(
      () => say("Database path copied"),
      () => say("Could not copy the database path", true),
    );

  return (
    <MenuButton quiet wide legend={`Database, ${store.path}`} trigger={<Glyph icon={Database} size="lg" />}>
      <div className="flex items-start gap-1 px-3 pb-2 pt-2">
        <p className="min-w-0 flex-1 break-all font-mono text-micro">{store.path}</p>
        <Ghost onClick={copy} tight aria-label="Copy the database path" icon={<Glyph icon={Copy} size="sm" />} />
      </div>

      <div className="border-t border-base-300 py-1.5">
        <Fact label="Size" value={byteSize(store.bytes)} />
        {store.logBytes > 0 && <Fact label="Unmerged log" value={byteSize(store.logBytes)} />}
        <Fact label="Last written" value={new Date(store.modified).toLocaleString()} />
        <Fact label="Postings" value={store.postings.toLocaleString()} />
        <Fact label="Staged" value={store.staged.toLocaleString()} />
      </div>
    </MenuButton>
  );
}
