"use client";

import type { ReactNode } from "react";
import Field from "@/components/edit/Field";
import RemoveMenu from "@/components/edit/RemoveMenu";
import { COLUMNS, type Column } from "@/components/edit/columns";
import { Card } from "@/components/ui";
import type { Employer } from "@/lib/queries";

type Editable = keyof typeof COLUMNS;

export const editing =
  (table: Editable, row: { rowid: number }) =>
  (name: string, look: Partial<Column> = {}) => {
    const known: Column[] = COLUMNS[table];
    const column = { ...known.find((one) => one.name === name), name, ...look };
    const value = (row as unknown as Record<string, string | number | null>)[name] ?? null;
    return <Field table={table} rowid={row.rowid} column={column} value={value} />;
  };

export const Span = ({ table, row }: { table: "employers" | "projects" | "education"; row: { rowid: number } }) => {
  const edit = editing(table, row);
  const ends = table === "education" ? "finished" : "finish";
  return (
    <span className="tnum flex items-baseline gap-1 text-xs">
      <span className="w-24">{edit("start", { className: "text-right", placeholder: "start" })}</span>
      <span aria-hidden className="text-soft">
        –
      </span>
      <span className="w-24">{edit(ends, { placeholder: "now" })}</span>
    </span>
  );
};

export const EmployerMenu = ({ employer, then }: { employer: Employer; then?: string }) => (
  <RemoveMenu
    table="employers"
    rowid={employer.rowid}
    name={employer.name}
    noun="employer"
    warning={`${employer.name} and its ${employer.projects.length} projects`}
    then={then}
  />
);

export const Detail = ({ head, tools, children }: { head: ReactNode; tools: ReactNode; children: ReactNode }) => (
  <Card soft>
    <header className="flex items-start gap-3">
      <div className="min-w-0 flex-1 font-display text-2xl font-medium">{head}</div>
      {tools}
    </header>
    {children}
  </Card>
);

export const Labeled = ({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <section className={className}>
    <h3 className="eyebrow mb-1 pl-1.5">{label}</h3>
    {children}
  </section>
);
