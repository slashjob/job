#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import fs from "node:fs";

import { printRows } from "../lib/core/table.ts";
import { companies, insert } from "../lib/network.ts";
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
  "cli/network.ts",
  `Store who the user can reach on LinkedIn at companies they applied to.

  cli/network.ts companies             every company applied to
  cli/network.ts companies "Acme"      one company, at any status
  cli/network.ts insert --company "Acme" --file - <<'EOF'
                                       replace everyone held for that company

A contact is {name, url, title, degree, introducer, shared_group,
shared_school}. \`url\` is their LinkedIn profile. \`degree\` is 1st or 2nd.
\`introducer\` is the mutual connection a 2nd is reached through.
\`shared_group\` is a LinkedIn group the user is in too.
\`shared_school\` is a school the user went to too.
Each contact needs a degree, a shared group or a shared school.

\`insert\` replaces the company's contacts with the array it is given,
so an empty array records that nobody is there.`,
);

program
  .command("companies")
  .description("the companies to look up")
  .argument("[name]")
  .option("--json")
  .action(
    runs((name: string | undefined, options) => {
      printRows(companies(name), options.json);
    }),
  );

program
  .command("insert")
  .description("replace the contacts held for one company")
  .requiredOption("--company <name>", "as cli/network.ts companies spells it")
  .requiredOption("--file <path>", "a JSON array of contacts, or - for stdin")
  .action(
    runs((options) => {
      const stored = insert(options.company, read(options.file));
      console.log(`${stored.company}  ${stored.held} held`);
    }),
  );

program.parseAsync();
