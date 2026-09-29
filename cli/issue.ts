#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";

import { Command } from "commander";

import { drafted, opened } from "../lib/issue.ts";
import { fail, guard } from "./kit.ts";

new Command("cli/issue.ts")
  .description(
    `Open a GitHub issue for a bug in this skill, filled in and waiting for the user to submit.

  echo "<body>" | cli/issue.ts --title "<title>"

The body comes on stdin, in Markdown. The /job, Claude Code, Node and OS versions are
appended to it. It opens in the user's default browser, where they are signed in to
GitHub, not the skill's browser; the URL is printed too, in case nothing opened.`,
  )
  .requiredOption("--title <title>", "one line: what broke, where")
  .option("--no-open", "print the URL without opening it")
  .action(
    guard((options: { title: string; open: boolean }) => {
      const body = fs.readFileSync(0, "utf8");
      if (!body.trim()) fail("no body on stdin; say what they did, what happened, and what should have happened");
      const { url, cut } = drafted(options.title, body);
      if (options.open) opened(url);
      if (cut) console.log("cut: the body was too long for a link and was shortened");
      console.log(url);
      console.log(
        "say: I've opened a GitHub issue with the problem already written up. Check it over, then click the button to submit it — that sends it straight to the developer.",
      );
    }),
  )
  .parseAsync();
