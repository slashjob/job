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
  contacts: z.number(),
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
    "SELECT triage.*, postings.reason, staged.blocked_on," +
      "       (SELECT COUNT(*) FROM contacts WHERE contacts.company = triage.company) AS contacts " +
      "FROM triage JOIN postings USING (key) LEFT JOIN staged USING (key)",
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
  contacts: number;
};

export function prospect(key: string): Prospect | null {
  const posting = one(VIEWS.prospects, "SELECT * FROM prospects WHERE key=?", [key]);
  if (!posting) return null;
  return {
    posting,
    staged: one(STAGED, "SELECT url, status, blocked_on FROM staged WHERE key=?", [key]),
    contacts: rows(TABLES.contacts.pick({ url: true }), "SELECT url FROM contacts WHERE company=?", [posting.company])
      .length,
  };
}

const ROLE = TABLES.postings.pick({ key: true, company: true, title: true });

export type Contact = z.infer<typeof TABLES.contacts>;
export type Circle = { company: string; roles: z.infer<typeof ROLE>[]; people: Contact[] };

export function network(): Circle[] {
  const people = rows(TABLES.contacts, "SELECT * FROM contacts ORDER BY degree IS NULL, degree, name");
  const roles = rows(
    ROLE,
    "SELECT key, company, title FROM postings " +
      "WHERE status IN ('shortlisted','staged','applied','interviewing') ORDER BY last_updated DESC",
  );
  const applied = roles.map((role) => role.company);
  const recency = (company: string) => (applied.includes(company) ? applied.indexOf(company) : applied.length);

  return [...new Set(people.map((person) => person.company))]
    .sort((left, right) => recency(left) - recency(right) || left.localeCompare(right))
    .map((company) => ({
      company,
      roles: roles.filter((role) => role.company === company),
      people: people.filter((person) => person.company === company),
    }));
}

const STORY = TABLES.news
  .pick({ article_id: true, title: true, url: true, source: true, published: true, status: true, reason: true })
  .extend({ company: z.string(), project_id: z.number().nullable(), contacts: z.number() });

export type Story = z.infer<typeof STORY>;

export const news = (): Story[] =>
  rows(
    STORY,
    "SELECT news.article_id, news.title, news.url, news.source, news.published, news.status, news.reason," +
      "       news.company, news.project_id," +
      "       (SELECT COUNT(*) FROM contacts WHERE contacts.company = news.company) AS contacts " +
      "FROM news " +
      "WHERE news.status IN ('lead','messaged') ORDER BY news.published IS NULL, news.published DESC",
  );

const TOPIC = z.object({
  project_id: z.number(),
  name: z.string(),
  employer_id: z.number(),
  query: z.string(),
  paused: z.number(),
});

export type Topic = z.infer<typeof TOPIC>;

export const topics = (): Topic[] =>
  rows(
    TOPIC,
    "SELECT news_topics.project_id, projects.name, projects.employer_id, news_topics.query, news_topics.paused " +
      "FROM news_topics JOIN projects ON projects.id = news_topics.project_id " +
      "WHERE news_topics.query IS NOT NULL ORDER BY projects.employer_id, projects.seq",
  );
