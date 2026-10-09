import { createHash } from "node:crypto";
import { z } from "zod";

import { db, one, rows } from "./core/db.ts";

const LATEST = "https://newsdata.io/api/1/latest";
const KEY = "newsdata_key";

const Article = z.object({
  article_id: z.string(),
  title: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  pubDate: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
});

const Reply = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), results: z.array(Article), nextPage: z.string().nullable().optional() }),
  z.object({
    status: z.literal("error"),
    results: z.object({ code: z.string().optional(), message: z.string().optional() }).optional(),
  }),
]);

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

export type Search = { title: boolean; hours?: number; pages: number; project?: number | string };

const Topic = z.object({
  project_id: z.number(),
  name: z.string(),
  about: z.string().nullable(),
  query: z.string().nullable(),
  basis: z.string().nullable(),
  paused: z.number().nullable(),
});

const Technology = z.object({ project_id: z.number(), technology: z.string() });

const basis = (topic: { name: string; about: string | null; technologies: string[] }) =>
  createHash("sha256")
    .update([topic.name, topic.about ?? "", ...topic.technologies].join("\n"))
    .digest("hex")
    .slice(0, 16);

const held = () => {
  const used = rows(Technology, "SELECT project_id, technology FROM project_technologies ORDER BY technology");
  return rows(
    Topic,
    "SELECT projects.id AS project_id, projects.name, projects.about, news_topics.query, news_topics.basis," +
      "       news_topics.paused " +
      "FROM projects LEFT JOIN news_topics ON news_topics.project_id = projects.id ORDER BY projects.id",
  ).map((topic) => ({
    ...topic,
    technologies: used.filter((row) => row.project_id === topic.project_id).map((row) => row.technology),
  }));
};

export function topics(stale: boolean) {
  const found = held();
  const shown = stale
    ? found.filter((topic) => topic.basis === null || (topic.query !== null && topic.basis !== basis(topic)))
    : found.filter((topic) => topic.query !== null);
  return shown.map(({ project_id, name, about, technologies, query, paused }) => ({
    project_id,
    name,
    about,
    technologies: technologies.join(", "),
    query,
    paused: paused === 1,
  }));
}

export function write(project: number | string, query: string, restore: boolean) {
  const id = projectId(project);
  const topic = held().find((row) => row.project_id === id)!;
  if (topic.basis !== null && topic.query === null && !restore)
    throw new Error(`the user removed '${topic.name}' from the news search; --restore only if they asked for it back`);
  db()
    .prepare(
      "INSERT INTO news_topics(project_id,query,basis) VALUES(?,?,?) ON CONFLICT(project_id) DO UPDATE " +
        "SET query=excluded.query, basis=excluded.basis, written_on=date('now')",
    )
    .run(id, query.trim(), basis(topic));
  return topic.name;
}

export function pause(project: number | string, paused: boolean) {
  const id = projectId(project);
  if (
    !db().prepare("UPDATE news_topics SET paused=? WHERE project_id=? AND query IS NOT NULL").run(Number(paused), id)
      .changes
  )
    throw new Error(`project ${project} has no news search to ${paused ? "pause" : "resume"}`);
}

export function drop(project: number | string) {
  const id = projectId(project);
  const topic = held().find((row) => row.project_id === id)!;
  db().transaction(() => {
    db()
      .prepare(
        "INSERT INTO news_topics(project_id,query,basis) VALUES(?,NULL,?) ON CONFLICT(project_id) DO UPDATE SET query=NULL",
      )
      .run(id, basis(topic));
    db().prepare("UPDATE news SET status='passed' WHERE project_id=? AND status='lead'").run(id);
  })();
  return topic.name;
}

export function remember(key: string) {
  db()
    .prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(KEY, key.trim());
}

const apikey = () => {
  const held = one(z.object({ value: z.string().nullable() }), "SELECT value FROM settings WHERE key=?", [KEY]);
  if (!held?.value)
    throw new Error("no NewsData API key is held: ask the user for theirs, then run cli/news.ts key <key>");
  return held.value;
};

async function latest(query: string, search: Search, page?: string) {
  const params = new URLSearchParams({ apikey: apikey(), language: "en", removeduplicate: "1" });
  params.set(search.title ? "qInTitle" : "q", query.replace(/\s+/g, " ").trim());
  if (search.hours) params.set("timeframe", String(search.hours));
  if (page) params.set("page", page);
  const answered = await fetch(`${LATEST}?${params}`);
  const reply = Reply.parse(await answered.json());
  if (reply.status === "error")
    throw new Error(
      `NewsData refused '${query}': ${reply.results?.code ?? answered.status} ${reply.results?.message ?? ""}`.trim(),
    );
  return reply;
}

const queried = (searched: ReturnType<typeof topics>, project: number | string) => {
  const id = projectId(project);
  const topic = searched.find((held) => held.project_id === id);
  if (!topic) throw new Error(`project '${project}' has no query yet; write one with cli/news.ts topic`);
  return topic.query!;
};

export async function search(search: Search) {
  const searched = topics(false);
  if (!searched.length) throw new Error("no project has a query yet; cli/news.ts topics --stale lists them");
  const queries =
    search.project === undefined
      ? searched.filter((topic) => !topic.paused).map((topic) => topic.query!)
      : [queried(searched, search.project)];
  if (!queries.length) throw new Error("the user has paused every project's search");
  const add = db().prepare(
    "INSERT OR IGNORE INTO news(article_id,title,url,source,published,summary) VALUES(?,?,?,?,?,?)",
  );
  const found: string[] = [];
  for (const query of queries) {
    let page: string | undefined;
    for (let read = 0; read < search.pages; read++) {
      const reply = await latest(query, search, page);
      for (const article of reply.results) {
        if (!article.title?.trim() || !article.link?.startsWith("http")) continue;
        const stored = add.run(
          article.article_id,
          article.title.trim(),
          article.link,
          article.source_name ?? article.source_id ?? null,
          article.pubDate ?? null,
          article.description?.trim() || null,
        );
        if (stored.changes) found.push(article.article_id);
      }
      page = reply.nextPage ?? undefined;
      if (!page) break;
    }
  }
  return found.length;
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
  let leads = 0;
  db().transaction(() => {
    for (const held of verdicts) {
      const lead = held.verdict === "lead";
      const changed = lead
        ? update.run("lead", held.company, projectId(held.project), held.reason, held.article_id)
        : update.run("noise", null, null, null, held.article_id);
      if (!changed.changes) throw new Error(`${held.article_id} is not an unjudged article`);
      if (lead) leads++;
    }
  })();
  return { judged: verdicts.length, leads };
}

export const leads = (all: boolean) =>
  rows(
    Lead,
    "SELECT news.article_id, company, projects.name AS project, reason, title, url, published, status " +
      "FROM news LEFT JOIN projects ON projects.id = news.project_id " +
      `WHERE status ${all ? "IN ('lead','messaged','passed')" : "= 'lead'"} ORDER BY published DESC`,
  );

export function mark(article_id: string, status: "messaged" | "passed") {
  const changed = db()
    .prepare("UPDATE news SET status=? WHERE article_id=? AND status IN ('lead','messaged','passed')")
    .run(status, article_id);
  if (!changed.changes) throw new Error(`${article_id} is not a lead`);
}
