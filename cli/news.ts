#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";

import { printRows } from "../lib/core/table.ts";
import { add, judge, leads, pending, projects } from "../lib/news.ts";
import { action, fail } from "./kit.ts";

const read = (named: string) => {
  const held = fs.readFileSync(named === "-" ? 0 : named, "utf8");
  try {
    return JSON.parse(held);
  } catch (error) {
    fail(`${named === "-" ? "stdin" : named} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const { program, runs } = action(
  "cli/news.ts",
  `Find companies in the news building what the user has built.

  cli/news.ts projects                 what each project built, to search for
  cli/news.ts add --file - <<'EOF'     store articles read off Google News
  cli/news.ts pending                  every article not yet judged
  cli/news.ts judge --file - <<'EOF'   record a verdict on each
  cli/news.ts leads                    the leads not yet acted on

An article is {title, url, source, published, summary, image}; only title and
url are required. One already held, by url, is skipped.

A verdict is {article_id, verdict: "noise"} or {article_id, verdict: "lead",
company, project, reason}. \`project\` is a project's id or exact name;
\`reason\` is one line on what the company is building that the project did.`,
);

program
  .command("projects")
  .description("every project, with what it is about and built with")
  .option("--json")
  .action(runs((options) => printRows(projects(), options.json)));

program
  .command("add")
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
      const { judged, leads, repeats } = judge(read(options.file));
      console.log(`${judged} judged  ${leads} leads  ${repeats} already leads, kept as noise`);
    }),
  );

program
  .command("leads")
  .description("leads not yet passed")
  .option("--all", "passed too")
  .option("--json")
  .action(runs((options) => printRows(leads(Boolean(options.all)), options.json)));

program.parseAsync();
