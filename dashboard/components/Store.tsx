"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Database, Plus } from "lucide-react";

import { MenuButton } from "./Flyout";
import Glyph from "./Glyph";
import { say } from "./Toaster";
import { answered, reported } from "./edit/answered";
import { Dot, Ghost, Row, TextField } from "@/components/ui";
import { createDatabase, switchDatabase } from "@/lib/databases";
import { byteSize } from "@/lib/format";
import type { Store as Facts } from "@/lib/store";

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3 py-1">
    <span className="text-xs text-soft">{label}</span>
    <span className="tnum text-xs">{value}</span>
  </div>
);

function Adder({ onMade }: { onMade: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding)
    return (
      <Row onClick={() => setAdding(true)} className="flex items-center gap-2 text-soft">
        <Glyph icon={Plus} size="sm" />
        New database
      </Row>
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await answered(createDatabase(name));
    if (reported(result)) return;
    setName("");
    setAdding(false);
    onMade(result.name);
  };

  return (
    <form onSubmit={submit} className="px-2 py-1">
      <TextField
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          setAdding(false);
        }}
        placeholder="Name, then Enter"
        aria-label="New database name"
        maxLength={40}
      />
    </form>
  );
}

export default function Store({ store }: { store: Facts }) {
  const router = useRouter();

  const copy = () =>
    navigator.clipboard.writeText(store.path).then(
      () => say("Database path copied"),
      () => say("Could not copy the database path", true),
    );

  const moved = (name: string) => {
    say(`Using ${name}`);
    router.push("/jobs");
    router.refresh();
  };

  const pick = async (name: string) => {
    if (name === store.name) return;
    const result = await answered(switchDatabase(name));
    if (reported(result)) return;
    moved(result.name);
  };

  return (
    <MenuButton
      quiet
      wide
      legend={`Database ${store.name}, ${store.path}`}
      trigger={<Glyph icon={Database} size="lg" />}
    >
      <h2 className="eyebrow px-3 pb-1 pt-1">Database</h2>
      {store.names.map((name) => {
        const on = name === store.name;
        return (
          <Row
            key={name}
            role="menuitemradio"
            aria-checked={on}
            onClick={() => pick(name)}
            className={`flex items-center gap-2 ${on ? "font-medium text-base-content" : "text-soft"}`}
          >
            <Dot tone={on ? "signal" : "none"} />
            {name}
          </Row>
        );
      })}
      <Adder onMade={moved} />

      <div className="mt-1 flex items-start gap-1 border-t border-base-300 px-3 pb-2 pt-2">
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
