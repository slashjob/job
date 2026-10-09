#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";

import { printRows } from "../lib/core/table.ts";
import { drop, judge, leads, mark, pause, pending, remember, search, topics, write } from "../lib/news.ts";
import { action, fail } from "./kit.ts";

const read = (named: string) => {
  const held = fs.readFileSync(named === "-" ? 0 : named, "utf8");
  try {
    return JSON.parse(held);
  } catch (error) {
    fail(`${named === "-" ? "stdin" : named} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const named = (project: string) => (/^\d+$/.test(project) ? Number(project) : project);

const { program, runs } = action(
  "cli/news.ts",
  `Find companies in the news building what the user has built.

  cli/news.ts key <key>                hold the user's NewsData API key
  cli/news.ts topics --stale           projects with no query, or changed since theirs
  cli/news.ts topic --project 7 --query '"route optimization" AND freight'
                                       write a project's query
  cli/news.ts pause --project 7        skip a project until resumed
  cli/news.ts resume --project 7
  cli/news.ts drop --project 7         stop searching a project for good
  cli/news.ts search                   fetch the latest articles for every query
  cli/news.ts search --project 7       for one project's query, paused or not
  cli/news.ts pending                  every article not yet judged
  cli/news.ts judge --file - <<'EOF'   record a verdict on each
  cli/news.ts leads                    the leads not yet acted on
  cli/news.ts mark <article_id> messaged

A query takes AND, OR, NOT, quotes and parentheses. Each page of results
costs one NewsData credit.

A verdict is {article_id, verdict: "noise"} or {article_id, verdict: "lead",
company, project, reason}. \`project\` is a project's id or exact name;
\`reason\` is one line on what the company is building that the project did.`,
);

program
  .command("key")
  .description("hold the user's NewsData API key")
  .argument("<key>")
  .action(
    runs((key: string) => {
      remember(key);
      console.log("held");
    }),
  );

program
  .command("topics")
  .description("the projects searched, and their queries")
  .option("--stale", "projects with no query yet, or changed since it was written")
  .option("--json")
  .action(runs((options) => printRows(topics(Boolean(options.stale)), options.json)));

program
  .command("topic")
  .description("write the query a project is searched by")
  .requiredOption("--project <id or name>")
  .requiredOption("--query <query>")
  .option("--restore", "search a project the user removed")
  .action(
    runs((options) => {
      console.log(`${write(named(options.project), options.query, Boolean(options.restore))}  ${options.query}`);
    }),
  );

for (const [command, paused] of [
  ["pause", true],
  ["resume", false],
] as const)
  program
    .command(command)
    .description(paused ? "skip a project's search until resumed" : "search a paused project again")
    .requiredOption("--project <id or name>")
    .action(
      runs((options) => {
        pause(named(options.project), paused);
        console.log(`${options.project}  ${paused ? "paused" : "resumed"}`);
      }),
    );

program
  .command("drop")
  .description("stop searching a project, and pass its leads")
  .requiredOption("--project <id or name>")
  .action(
    runs((options) => {
      console.log(`${drop(named(options.project))}  dropped`);
    }),
  );

program
  .command("search")
  .description("fetch the latest articles for every query and keep the ones not seen before")
  .option("--project <id or name>", "only this project's query, even if paused")
  .option("--title", "match the headline only")
  .option("--hours <n>", "only articles from the last n hours, up to 48", Number)
  .option("--pages <n>", "pages of ten to read per query", Number, 1)
  .action(
    runs(async (options) => {
      const found = await search({
        title: Boolean(options.title),
        hours: options.hours,
        pages: options.pages,
        project: options.project === undefined ? undefined : named(options.project),
      });
      console.log(`${found} new`);
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
      const { judged, leads } = judge(read(options.file));
      console.log(`${judged} judged  ${leads} leads`);
    }),
  );

program
  .command("leads")
  .description("leads not yet messaged or passed")
  .option("--all", "messaged and passed too")
  .option("--json")
  .action(runs((options) => printRows(leads(Boolean(options.all)), options.json)));

program
  .command("mark")
  .description("record what became of a lead")
  .argument("<article_id>")
  .argument("<status>", "messaged or passed")
  .action(
    runs((article_id: string, status: string) => {
      if (status !== "messaged" && status !== "passed") fail("status is messaged or passed");
      mark(article_id, status);
      console.log(`${article_id}  ${status}`);
    }),
  );

program.parseAsync();
