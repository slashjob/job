import { z } from "zod";

import { one, rows } from "./db.ts";
import { TABLES, VIEWS, options, type Table } from "./schema.ts";

export { options };

type Rowed<T extends Table> = z.infer<(typeof TABLES)[T]> & { rowid: number };

const withRowid = <T extends Table>(table: T) =>
  TABLES[table].extend({ rowid: z.number() }) as unknown as z.ZodType<Rowed<T>>;

const listing = <T extends Table>(table: T, order = "") =>
  rows(withRowid(table), `SELECT rowid AS rowid, * FROM ${table} ${order}`);

export type Project = Rowed<"projects"> & {
  technologies: Rowed<"project_technologies">[];
};
export type Employer = Rowed<"employers"> & { projects: Project[] };
export type Degree = Rowed<"education">;

const singleton = <T extends Table>(table: T) =>
  one(withRowid(table), `SELECT rowid AS rowid, * FROM ${table}`) as Rowed<T>;

export const identity = () => singleton("identity");
export const instructions = () => singleton("instructions");
export const summary = () => singleton("summary");

export type Model = { key: string; label: string };

export const MODELS: Model[] = [
  { key: "opus", label: "Opus" },
  { key: "sonnet", label: "Sonnet" },
  { key: "haiku", label: "Haiku" },
];

const FALLBACK = "sonnet";

export const model = () =>
  one(TABLES.settings.pick({ value: true }), "SELECT value FROM settings WHERE key='model'")?.value ?? FALLBACK;

const ANSWER = VIEWS.answers.extend({ section: z.string(), field: z.string() });

export const answers = () => rows(ANSWER, "SELECT section, field, value FROM answers");
export const education = () => listing("education");

const TRIAGE = VIEWS.triage.extend({
  reason: TABLES.postings.shape.reason,
  blocked_on: TABLES.staged.shape.blocked_on,
});

export type Job = z.infer<typeof TRIAGE>;

export const names = () =>
  Object.fromEntries(
    rows(
      TABLES.postings.pick({ key: true, company: true, title: true }),
      "SELECT key, company, title FROM postings",
    ).map((posting) => [posting.key, `${posting.company} · ${posting.title}`]),
  );

export const jobs = () =>
  rows(
    TRIAGE,
    "SELECT triage.*, postings.reason, staged.blocked_on FROM triage JOIN postings USING (key) LEFT JOIN staged USING (key)",
  );

export function career(): Employer[] {
  const technologies = listing("project_technologies", "ORDER BY project_id, technology");
  const under = <T extends { project_id: number }>(all: T[], project: number) =>
    all.filter((row) => row.project_id === project);

  const projects = listing("projects", "ORDER BY seq IS NULL, seq, rowid").map((project) => ({
    ...project,
    technologies: under(technologies, project.rowid),
  }));

  return listing("employers", "ORDER BY seq IS NULL, seq, rowid").map((employer) => ({
    ...employer,
    projects: projects.filter((project) => project.employer_id === employer.rowid),
  }));
}

const STAGED = TABLES.staged.omit({ key: true });

export type Posting = z.infer<typeof VIEWS.prospects>;
export type Prospect = {
  posting: Posting;
  staged: z.infer<typeof STAGED> | null;
};

export function prospect(key: string): Prospect | null {
  const posting = one(VIEWS.prospects, "SELECT * FROM prospects WHERE key=?", [key]);
  if (!posting) return null;
  return {
    posting,
    staged: one(STAGED, "SELECT url, status, blocked_on FROM staged WHERE key=?", [key]),
  };
}
