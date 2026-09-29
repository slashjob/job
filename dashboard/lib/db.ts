import Database from "better-sqlite3";
import type { z } from "zod";
import fs from "node:fs";

import { TABLES, VIEWS } from "./db.gen.ts";
import { DB } from "./skill.ts";

type Held = { name: string; notnull: number; pk: number };

const held = globalThis as { db?: Database.Database };

function matched(database: Database.Database) {
  const wrong: string[] = [];
  for (const [name, shape] of Object.entries({ ...TABLES, ...VIEWS })) {
    const found = database.pragma(`table_info(${name})`) as Held[];
    if (!found.length) {
      wrong.push(`${name}: missing`);
      continue;
    }
    const expected = Object.keys(shape.shape);
    const names = found.map((column) => column.name);
    const extra = names.filter((column) => !expected.includes(column));
    const lacking = expected.filter((column) => !names.includes(column));
    if (extra.length) wrong.push(`${name}: unexpected ${extra.join(", ")}`);
    if (lacking.length) wrong.push(`${name}: no column ${lacking.join(", ")}`);

    if (!(name in TABLES)) continue;
    for (const column of found) {
      const declared = shape.shape[column.name as never] as z.ZodType | undefined;
      const nullable = !column.notnull && !column.pk;
      if (declared && declared.safeParse(null).success !== nullable)
        wrong.push(`${name}.${column.name}: the database says ${nullable ? "nullable" : "NOT NULL"}`);
    }
  }
  if (wrong.length)
    throw new Error(
      `the job database does not match this dashboard, so one of the two is out of date; update the older one:\n${wrong.join("\n")}`,
    );
}

function connect() {
  if (!fs.existsSync(DB)) throw new Error(`no job database at ${DB}; run /job setup in Claude Code first`);
  const opened = new Database(DB, { fileMustExist: true });
  opened.pragma("foreign_keys = ON");
  opened.pragma("busy_timeout = 5000");
  matched(opened);
  return opened;
}

export const db = () => (held.db ??= connect());

const parsed = <T extends z.ZodType>(shape: T, sql: string, row: unknown): z.infer<T> => {
  const read = shape.safeParse(row);
  if (read.success) return read.data;
  throw new Error(
    `${sql}\nreturned a row its shape does not describe:\n` +
      read.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n"),
  );
};

export const rows = <T extends z.ZodType>(shape: T, sql: string, args: unknown[] = []): z.infer<T>[] =>
  (
    db()
      .prepare(sql)
      .all(...args) as unknown[]
  ).map((row) => parsed(shape, sql, row));

export const one = <T extends z.ZodType>(shape: T, sql: string, args: unknown[] = []): z.infer<T> | null => {
  const found = db()
    .prepare(sql)
    .get(...args);
  return found === undefined || found === null ? null : parsed(shape, sql, found);
};
