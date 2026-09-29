#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";
import path from "node:path";

import { DOWNLOADS } from "../lib/core/db.ts";
import { insert, undescribed } from "../lib/search.ts";
import { fail, action } from "./kit.ts";

const located = (named: string) => {
  if (named === "-") return { at: "stdin", held: fs.readFileSync(0, "utf8") };
  const tried = [named, path.join(DOWNLOADS, path.basename(named))];
  const at = tried.find((held) => fs.existsSync(held));
  if (!at) fail(`no postings at ${tried.join(" or ")}`);
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

const { program, runs } = action(
  "cli/search.ts",
  `Store the postings a search turned up.

  cli/search.ts insert --file found.json     store postings read off the boards
  cli/search.ts insert --file - <<'EOF'      the same, from stdin, with no file to write first
  cli/search.ts undescribed                  kept postings with no description yet

A posting is {key, source, company, title, url, location, remote, compensation,
posted_at, description, score, reason}. \`key\` is '<source>:<id>' -- the id of the
site the posting lives on, so the same opening reaches the same row on any later run.

\`score\` is 0-10 and needs its \`reason\`; the threshold in settings turns it into
a status, so a scored posting lands shortlisted or skipped in one step. Leave both
out and the posting sits at 'new' until cli/score.ts sets them.

Where to search, and how to key what is found, is references/boards.md.`,
);

program
  .command("insert")
  .description("store postings, skipping any opening already held")
  .requiredOption("--file <path>", "a JSON array of postings, or - for stdin")
  .action(
    runs((options) => {
      const held = insert(read(options.file));
      console.log(`READ ${held.read}, added ${held.added}`);
      if (held.unjudged) console.log(`${held.unjudged} added with no score — they sit at 'new' until one is set`);
      if (!held.skipped.length) return;
      console.log(`\nalready held (${held.skipped.length}):`);
      for (const row of held.skipped) console.log(`  ${row.company} — ${row.title}  →  ${row.holder}`);
    }),
  );

program
  .command("undescribed")
  .description("postings with no description; scoring refuses these")
  .action(
    runs(() => {
      const held = undescribed();
      if (!held.length) return console.log("every posting has a description");
      console.log(`${held.length} postings have no description:`);
      for (const row of held) console.log(`  ${row.key}  ${row.company} — ${row.title}  ${row.url ?? ""}`);
    }),
  );

program.parseAsync();
