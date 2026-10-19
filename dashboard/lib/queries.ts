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

const TRIAGE = VIEWS.triage;

export type Job = z.infer<typeof TRIAGE>;

export const names = () =>
  Object.fromEntries(
    rows(
      TABLES.postings.pick({ key: true, company: true, title: true }),
      "SELECT key, company, title FROM postings",
    ).map((posting) => [posting.key, `${posting.company} · ${posting.title}`]),
  );

const triaged = (where = "", args: unknown[] = []) => rows(TRIAGE, `SELECT * FROM triage ${where}`, args);

export const jobs = () => triaged();

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

export type Posting = z.infer<typeof VIEWS.prospects>;

export const prospect = (key: string) => one(VIEWS.prospects, "SELECT * FROM prospects WHERE key=?", [key]);

const MATCH = z.object({ article_id: z.string(), project_id: z.number(), project: z.string(), employer_id: z.number() });

export type Match = z.infer<typeof MATCH>;

const ARTICLE = TABLES.news
  .pick({ article_id: true, title: true, url: true, source: true, published: true, reason: true })
  .extend({ company_id: z.number() });

export type Article = z.infer<typeof ARTICLE> & { projects: Match[] };

const articles = (where: string, args: unknown[] = []): Article[] => {
  const matched = rows(
    MATCH,
    "SELECT news_projects.article_id, projects.id AS project_id, projects.name AS project, projects.employer_id " +
      "FROM news_projects JOIN projects ON projects.id = news_projects.project_id ORDER BY projects.id",
  );
  return rows(
    ARTICLE,
    "SELECT news.article_id, news.title, news.url, news.source, news.published, news.reason, news.company_id " +
      `FROM news WHERE news.status = 'lead' ${where} ORDER BY news.published IS NULL, news.published DESC`,
    args,
  ).map((article) => ({
    ...article,
    projects: matched.filter((match) => match.article_id === article.article_id),
  }));
};

const CONTACT = TABLES.contacts.omit({ company_id: true });

export type Contact = z.infer<typeof CONTACT>;

const COMPANY = TABLES.companies.pick({ id: true, name: true, website: true, found_on: true }).extend({
  contacts: z.number(),
});

export type Company = z.infer<typeof COMPANY> & { articles: Article[]; jobs: Job[] };

const listed = (where: string, args: unknown[] = []) =>
  rows(
    COMPANY,
    "SELECT c.id, c.name, c.website, c.found_on," +
      " (SELECT count(*) FROM contacts WHERE company_id = c.id) AS contacts " +
      `FROM companies c WHERE c.status = 'lead' ${where}`,
    args,
  );

export function companies(): Company[] {
  const news = articles("");
  const held = jobs();
  return listed("").map((company) => ({
    ...company,
    articles: news.filter((article) => article.company_id === company.id),
    jobs: held.filter((job) => job.company_id === company.id),
  }));
}

export function company(id: number): (Company & { people: Contact[] }) | null {
  const [found] = listed("AND c.id = ?", [id]);
  if (!found) return null;
  return {
    ...found,
    articles: articles("AND news.company_id = ?", [id]),
    jobs: triaged("WHERE triage.company_id = ?", [id]),
    people: rows(CONTACT, "SELECT * FROM contacts WHERE company_id = ? ORDER BY id", [id]),
  };
}
