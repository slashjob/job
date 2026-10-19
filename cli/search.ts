#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";
import path from "node:path";

import { DOWNLOADS } from "../lib/core/db.ts";
import { printRows } from "../lib/core/table.ts";
import { addContacts, companies, contacts } from "../lib/company.ts";
import { instructions, openings, prospect } from "../lib/fit.ts";
import { add, judge, pending, projects } from "../lib/news.ts";
import { insert } from "../lib/search.ts";
import { fail, action } from "./kit.ts";

const located = (named: string) => {
  if (named === "-") return { at: "stdin", held: fs.readFileSync(0, "utf8") };
  const tried = [named, path.join(DOWNLOADS, path.basename(named))];
  const at = tried.find((held) => fs.existsSync(held));
  if (!at) fail(`nothing at ${tried.join(" or ")}`);
  return { at, held: fs.readFileSync(at, "utf8") };
};

const read = (named: string) => {
  const { at, held } = located(named);
  try {
    return JSON.parse(held);
  } catch (error) {
    fail(`${at} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const id = (held: string) => {
  const parsed = Number(held);
  if (!Number.isInteger(parsed)) fail(`--company takes a company's id, not '${held}'`);
  return parsed;
};

const { program, runs } = action(
  "cli/search.ts",
  `Store what a search turned up: articles, the companies they name, and each
company's openings and people.

  cli/search.ts projects                         what each project built, to search the news for
  cli/search.ts articles --file - <<'EOF'        store articles read off Google News
  cli/search.ts pending                          every article not yet judged
  cli/search.ts judge --file - <<'EOF'           record a verdict on each
  cli/search.ts companies --due                  companies whose openings or people are still to find
  cli/search.ts insert --company 3 --file -      store the openings found at company 3
  cli/search.ts contacts --company 3 --file -    store the people worth writing to there
  cli/search.ts contacts --company 3             the people stored for company 3
  cli/search.ts instructions                     the work history, profile facts and prose fit is judged against
  cli/search.ts openings --unbuilt               openings kept, with no resume yet
  cli/search.ts show KEY [KEY ...]               an opening's full text

An article is {title, url, source, published, summary}; only title and
url are required. One already held, by url, is skipped.

A verdict is {article_id, verdict: "noise"} or {article_id, verdict: "lead",
company, projects, reason}. \`projects\` lists each project's id or exact name;
\`reason\` is one line on what the company is building that they did. A
lead's company is matched to one already held by name, or added.

A posting is {key, source, company, title, url, location, remote, compensation,
posted_at, description}, kept only when it fits. \`key\` is '<source>:<id>' -- the
id of the site the posting lives on, so the same opening reaches the same row on any
later run. Insert an empty array for a company with no opening that fits: it marks
the company searched all the same.

A contact is {name, title, why, email, x, linkedin}; \`why\` is one line, and at
least one way to reach them is required. One already held, by name, is updated.`,
);

program
  .command("projects")
  .description("every project, with what it is about and built with")
  .option("--json")
  .action(runs((options) => printRows(projects(), options.json)));

program
  .command("articles")
  .description("store articles, skipping any already held")
  .requiredOption("--file <path>", "a JSON array of articles, or - for stdin")
  .action(
    runs((options) => {
      const { added, seen } = add(read(options.file));
      console.log(`${added} new  ${seen} seen before`);
    }),
  );

program
  .command("pending")
  .description("every article not yet judged")
  .option("--json")
  .action(runs((options) => printRows(pending(), options.json)));

program
  .command("judge")
  .description("record a verdict on articles not yet judged")
  .requiredOption("--file <path>", "a JSON array of verdicts, or - for stdin")
  .action(
    runs((options) => {
      const { judged, leads, companies } = judge(read(options.file));
      console.log(`${judged} judged  ${leads} leads  ${companies} new companies`);
    }),
  );

program
  .command("companies")
  .description("companies not passed on, with what each is building")
  .option("--due", "only those in the news whose openings were not searched this week, or with nobody to write to")
  .option("--json")
  .action(runs((options) => printRows(companies(Boolean(options.due)), options.json)));

program
  .command("insert")
  .description("store a company's openings, skipping any already held, and mark it searched")
  .requiredOption("--company <id>", "the company they are at")
  .requiredOption("--file <path>", "a JSON array of postings, or - for stdin")
  .option("--website <url>", "the company's own site, where it was found")
  .action(
    runs((options) => {
      const held = insert(read(options.file), id(options.company), options.website ?? null);
      console.log(`READ ${held.read}, added ${held.added}`);
      if (!held.skipped.length) return;
      console.log(`\nalready held (${held.skipped.length}):`);
      for (const row of held.skipped) console.log(`  ${row.company} — ${row.title}  →  ${row.holder}`);
    }),
  );

program
  .command("contacts")
  .description("store the people worth writing to at a company, or list them")
  .requiredOption("--company <id>", "the company they are at")
  .option("--file <path>", "a JSON array of contacts, or - for stdin")
  .option("--json")
  .action(
    runs((options) => {
      const at = id(options.company);
      if (!options.file) return printRows(contacts(at), options.json);
      const { added, updated } = addContacts(at, read(options.file));
      console.log(`${added} added  ${updated} updated`);
    }),
  );

program
  .command("instructions")
  .description("everything fit is judged against: the work history, the standing profile facts, then the instructions")
  .action(
    runs(() => {
      const { background, standing, text } = instructions();
      if (background.length) {
        console.log("What they have actually done:");
        for (const line of background) console.log(line);
        console.log("");
      }
      if (standing.length) {
        console.log("From the profile, and not up for debate:");
        for (const line of standing) console.log(`- ${line}`);
        console.log("");
      }
      console.log(text ?? "(nothing written down)");
    }),
  );

program
  .command("openings")
  .description("every opening kept, newest first; no descriptions, on purpose")
  .option("--unbuilt", "only those with no resume yet")
  .option("--json")
  .action(runs((options) => printRows(openings(Boolean(options.unbuilt)), options.json)));

program
  .command("show")
  .description("an opening's full text")
  .argument("<key...>")
  .action(
    runs((keys: string[]) => {
      for (const key of keys) {
        const row = prospect(key);
        if (!row) {
          console.error(`no opening '${key}'`);
          continue;
        }
        console.log(`${row.company} — ${row.title}  [${row.key}]`);
        console.log(
          `  ${row.location || "(no location)"}` +
            `${row.remote ? "  remote" : ""}` +
            `${row.compensation ? "  " + row.compensation : ""}`,
        );
        console.log(`  posted ${row.posted_at || "unknown"}`);
        console.log(`  ${row.url || ""}\n`);
        console.log(row.description || "(no description)");
        console.log("\n" + "-".repeat(78) + "\n");
      }
    }),
  );

program.parseAsync();
