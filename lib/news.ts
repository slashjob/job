import { createHash } from "node:crypto";
import { z } from "zod";

import { db, one, rows } from "./core/db.ts";

const Found = z.object({
  title: z.string().trim().min(1, "an article has a headline"),
  url: z.string().regex(/^https?:\/\//, "a URL, starting http"),
  source: z.string().trim().min(1).nullable().optional(),
  published: z.string().nullable().optional(),
  summary: z.string().trim().min(1).nullable().optional(),
  image: z
    .string()
    .regex(/^https?:\/\/.*\./, "a URL, starting http")
    .nullable()
    .optional(),
});

const Held = z.object({
  article_id: z.string(),
  title: z.string(),
  source: z.string().nullable(),
  published: z.string().nullable(),
  summary: z.string().nullable(),
});
const Lead = z.object({
  article_id: z.string(),
  company: z.string(),
  project: z.string().nullable(),
  reason: z.string(),
  title: z.string(),
  url: z.string(),
  published: z.string().nullable(),
  status: z.string(),
});
const Verdict = z.discriminatedUnion("verdict", [
  z.object({ article_id: z.string(), verdict: z.literal("noise") }),
  z.object({
    article_id: z.string(),
    verdict: z.literal("lead"),
    company: z.string().trim().min(1, "a lead names the company"),
    project: z.union([z.number(), z.string().trim().min(1)]),
    reason: z.string().trim().min(1, "a lead says why, in a line"),
  }),
]);

const Project = z.object({ project_id: z.number(), name: z.string(), about: z.string().nullable() });

const Technology = z.object({ project_id: z.number(), technology: z.string() });

export function projects() {
  const used = rows(Technology, "SELECT project_id, technology FROM project_technologies ORDER BY technology");
  return rows(Project, "SELECT id AS project_id, name, about FROM projects ORDER BY id").map((project) => ({
    ...project,
    technologies: used
      .filter((row) => row.project_id === project.project_id)
      .map((row) => row.technology)
      .join(", "),
  }));
}

const articleId = (url: string) => createHash("sha256").update(url).digest("hex").slice(0, 16);

export function add(payload: unknown) {
  const found = z.array(Found).parse(payload);
  const insert = db().prepare(
    "INSERT OR IGNORE INTO news(article_id,title,url,source,published,summary,image) VALUES(?,?,?,?,?,?,?)",
  );
  let added = 0;
  db().transaction(() => {
    for (const article of found)
      added += insert.run(
        articleId(article.url),
        article.title,
        article.url,
        article.source ?? null,
        article.published ?? null,
        article.summary ?? null,
        article.image ?? null,
      ).changes;
  })();
  return { added, seen: found.length - added };
}

export const pending = () =>
  rows(Held, "SELECT article_id,title,source,published,summary FROM news WHERE status='new' ORDER BY published DESC");

const projectId = (named: number | string) => {
  const found = one(
    z.object({ id: z.number() }),
    typeof named === "number" ? "SELECT id FROM projects WHERE id=?" : "SELECT id FROM projects WHERE name=?",
    [named],
  );
  if (!found) throw new Error(`no project '${named}'; cli/q.ts "SELECT id, name FROM projects" lists them`);
  return found.id;
};

export function judge(payload: unknown) {
  const verdicts = z.array(Verdict).parse(payload);
  const update = db().prepare(
    "UPDATE news SET status=?, company=?, project_id=?, reason=? WHERE article_id=? AND status='new'",
  );
  const already = db().prepare(
    "SELECT 1 FROM news WHERE status IN ('lead','passed') AND lower(trim(company)) = lower(trim(?))",
  );
  let leads = 0;
  let repeats = 0;
  db().transaction(() => {
    for (const held of verdicts) {
      const lead = held.verdict === "lead" && !already.get(held.company);
      const changed = lead
        ? update.run("lead", held.company, projectId(held.project), held.reason, held.article_id)
        : update.run("noise", null, null, null, held.article_id);
      if (!changed.changes) throw new Error(`${held.article_id} is not an unjudged article`);
      if (lead) leads++;
      else if (held.verdict === "lead") repeats++;
    }
  })();
  return { judged: verdicts.length, leads, repeats };
}

export const leads = (all: boolean) =>
  rows(
    Lead,
    "SELECT news.article_id, company, projects.name AS project, reason, title, url, published, status " +
      "FROM news LEFT JOIN projects ON projects.id = news.project_id " +
      `WHERE status ${all ? "IN ('lead','passed')" : "= 'lead'"} ORDER BY published DESC`,
  );
