"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { db, one } from "./db.ts";
import { MODELS } from "./queries.ts";
import { TABLES, bare, type Table } from "./schema.ts";
import { CAREER, absolute } from "./skill.ts";

const WRITABLE = new Set<Table>([
  "identity",
  "education",
  "employers",
  "projects",
  "project_technologies",
  "instructions",
  "summary",
]);

type Saved = { rowid: number } | { error: string };
type Dropped = { gone: string } | { error: string };

const failed = (error: unknown) => ({
  error:
    error instanceof z.ZodError
      ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
      : String((error as Error).message).replace(/\s+/g, " "),
});

function writable(table: string): Table {
  if (!WRITABLE.has(table as Table)) throw new Error(`${table} is not editable from the dashboard`);
  return table as Table;
}

const numeric = (table: Table, name: string) =>
  bare(TABLES[table].shape[name as never] as z.ZodType) instanceof z.ZodNumber;

const marshalled = (table: string, values: Record<string, string>) =>
  Object.fromEntries(
    Object.keys(TABLES[writable(table)].shape)
      .filter((name) => name in values)
      .map((name) => {
        const raw = values[name];
        return [
          name,
          raw === "" || raw === null || raw === undefined ? null : numeric(table as Table, name) ? Number(raw) : raw,
        ];
      }),
  );

export async function save(table: string, rowid: number | null, values: Record<string, string>): Promise<Saved> {
  try {
    const bound = marshalled(table, values);
    const names = Object.keys(bound);
    if (!names.length) return { error: `no writable column among ${Object.keys(values).join(", ") || "(none)"}` };

    TABLES[table as Table].partial().parse(bound);

    if (rowid === null) {
      rowid = Number(
        db()
          .prepare(`INSERT INTO ${table}(${names}) VALUES(${names.map((name) => ":" + name)})`)
          .run(bound).lastInsertRowid,
      );
    } else if (
      !db()
        .prepare(`UPDATE ${table} SET ${names.map((name) => `${name}=:${name}`)} WHERE rowid=:rowid`)
        .run({ ...bound, rowid }).changes
    ) {
      return { error: `no row ${rowid} in ${table}` };
    }
    revalidatePath("/", "layout");
    return { rowid };
  } catch (error) {
    return failed(error);
  }
}

export async function remove(table: string, rowid: number): Promise<Saved> {
  try {
    writable(table);
    if (!db().prepare(`DELETE FROM ${table} WHERE rowid=?`).run(rowid).changes)
      return { error: `no row ${rowid} in ${table}` };
    revalidatePath("/", "layout");
    return { rowid };
  } catch (error) {
    return failed(error);
  }
}

const RESUME_FILES = [".pdf", ".json", ".typ"];

function removeResume(held: string) {
  const pdf = absolute(held);
  if (!pdf.startsWith(CAREER + path.sep)) return;
  const stem = pdf.slice(0, -path.extname(pdf).length);
  for (const extension of RESUME_FILES) fs.rmSync(stem + extension, { force: true });
}

export async function discard(key: string): Promise<Dropped> {
  try {
    const found = one(z.object({ resume: z.string().nullable() }), "SELECT resume FROM postings WHERE key=?", [key]);
    if (!found) return { error: `no posting keyed ${key}` };
    db().prepare("DELETE FROM postings WHERE key=?").run(key);
    const shared =
      found.resume && one(z.object({ key: z.string() }), "SELECT key FROM postings WHERE resume=?", [found.resume]);
    if (found.resume && !shared) removeResume(found.resume);
    revalidatePath("/", "layout");
    return { gone: key };
  } catch (error) {
    return failed(error);
  }
}

export async function chooseModel(key: string): Promise<{ model: string } | { error: string }> {
  try {
    if (!MODELS.some((model) => model.key === key)) return { error: `no such model: ${key}` };
    db()
      .prepare(
        "INSERT INTO settings(key, value) VALUES('model', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .run(key);
    revalidatePath("/", "layout");
    return { model: key };
  } catch (error) {
    return failed(error);
  }
}
