#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";

import { connect } from "../lib/core/db.ts";
import { ACTIVE, CHOSEN, NAME, databases, home } from "../lib/core/paths.ts";
import { fail, guard } from "./kit.ts";

const choose = (name: string) => {
  fs.mkdirSync(path.dirname(CHOSEN), { recursive: true });
  fs.writeFileSync(CHOSEN, `${name}\n`);
  console.log(`now using ${name}`);
};

const program = new Command("cli/database.ts").description(
  `Each database is a separate search: its own profile, postings and resumes.
Every command uses the active one.

  cli/database.ts              list them, the active one marked *
  cli/database.ts use <name>   make <name> the active one
  cli/database.ts new <name>   create an empty one and make it active`,
);

program.action(() => {
  for (const name of databases()) console.log(`${name === ACTIVE ? "*" : " "} ${name}`);
});

program
  .command("use")
  .argument("<name>")
  .action(
    guard((name: string) => {
      if (!databases().includes(name)) fail(`no database named '${name}'; there are ${databases().join(", ")}`);
      choose(name);
    }),
  );

program
  .command("new")
  .argument("<name>")
  .action(
    guard((name: string) => {
      if (!NAME.test(name)) fail("a name is lowercase letters, digits and dashes, at most 40");
      if (databases().includes(name)) fail(`there is already a database named '${name}'`);
      connect(path.join(home(name), "job.db")).close();
      choose(name);
    }),
  );

program.parseAsync();
