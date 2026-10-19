import { company, searched } from "./company.ts";
import { db, rows as query } from "./core/db.ts";
import { POSTING_COLUMNS, Posting } from "./core/posting.ts";
import { TABLES } from "./core/schema.ts";
import { norm } from "./core/text.ts";

export type Skipped = { key: string; company: string; title: string; holder: string };

export type Inserted = {
  read: number;
  added: number;
  skipped: Skipped[];
};

const paired = (company: number, title: string) => `${company} ${norm(title)}`;

export function insert(payload: unknown, at: number, website: string | null): Inserted {
  company(at);
  const read = (Array.isArray(payload) ? payload : [payload]).map((held) => Posting.parse(held));

  const live = query(
    TABLES.postings.pick({ key: true, company_id: true, title: true }),
    "SELECT key, company_id, title FROM postings",
  );
  const keys = new Set(live.map((row) => row.key));
  const roles = new Map(live.map((row) => [paired(row.company_id, row.title), row.key]));

  const fresh: Posting[] = [];
  const skipped: Skipped[] = [];

  for (const row of read) {
    const holder = keys.has(row.key) ? row.key : roles.get(paired(at, row.title));
    if (holder) {
      skipped.push({ key: row.key, company: row.company, title: row.title, holder });
      continue;
    }
    keys.add(row.key);
    roles.set(paired(at, row.title), row.key);
    fresh.push(row);
  }

  const add = db().prepare(
    `INSERT INTO postings(${POSTING_COLUMNS.join(",")},company_id,first_fetched,last_fetched,ingested_on,last_updated) ` +
      `VALUES(${POSTING_COLUMNS.map(() => "?").join(",")},?,date('now'),date('now'),date('now'),date('now'))`,
  );

  db().transaction(() => {
    for (const row of fresh) add.run(...POSTING_COLUMNS.map((column) => row[column]), at);
    searched(at, website);
  })();

  return {
    read: read.length,
    added: fresh.length,
    skipped,
  };
}

export const undescribed = () =>
  query(
    TABLES.postings.pick({ key: true, company: true, title: true, url: true }),
    "SELECT key, company, title, url FROM postings WHERE description IS NULL OR trim(description)=''",
  );
