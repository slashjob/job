import { z } from "zod";

import { db, rows as query } from "./core/db.ts";
import { POSTING_COLUMNS, Posting } from "./core/posting.ts";
import { TABLES } from "./core/schema.ts";
import { norm, normCompany } from "./core/text.ts";

export type Skipped = { key: string; company: string; title: string; holder: string };

export type Inserted = {
  read: number;
  added: number;
  unjudged: number;
  skipped: Skipped[];
};

const Judged = Posting.extend({
  score: z.number().int().min(0).max(10).nullable().default(null),
  reason: z.string().nullable().default(null),
}).refine((held) => held.score === null || Boolean(held.reason?.trim()), {
  message: "a score needs the reason that drove it",
  path: ["reason"],
});

type Judged = z.infer<typeof Judged>;

const JUDGED_COLUMNS = [...POSTING_COLUMNS, "score", "reason"] as (keyof Judged)[];

const paired = (company: string, title: string) => `${normCompany(company)} ${norm(title)}`;

export function insert(payload: unknown): Inserted {
  const read = (Array.isArray(payload) ? payload : [payload]).map((held) => Judged.parse(held));

  const live = query(
    TABLES.postings.pick({ key: true, company: true, title: true }),
    "SELECT key, company, title FROM postings",
  );
  const keys = new Set(live.map((row) => row.key));
  const roles = new Map(live.map((row) => [paired(row.company, row.title), row.key]));

  const fresh: Judged[] = [];
  const skipped: Skipped[] = [];

  for (const row of read) {
    const holder = keys.has(row.key) ? row.key : roles.get(paired(row.company, row.title));
    if (holder) {
      skipped.push({ key: row.key, company: row.company, title: row.title, holder });
      continue;
    }
    keys.add(row.key);
    roles.set(paired(row.company, row.title), row.key);
    fresh.push(row);
  }

  const add = db().prepare(
    `INSERT INTO postings(${JUDGED_COLUMNS.join(",")},first_fetched,last_fetched,ingested_on) ` +
      `VALUES(${JUDGED_COLUMNS.map(() => "?").join(",")},date('now'),date('now'),date('now'))`,
  );

  db().transaction(() => {
    for (const row of fresh) add.run(JUDGED_COLUMNS.map((column) => row[column]));
  })();

  return {
    read: read.length,
    added: fresh.length,
    unjudged: fresh.filter((row) => row.score === null).length,
    skipped,
  };
}

export const undescribed = () =>
  query(
    TABLES.postings.pick({ key: true, company: true, title: true, url: true }),
    "SELECT key, company, title, url FROM postings WHERE description IS NULL OR trim(description)=''",
  );
