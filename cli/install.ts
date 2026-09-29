#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { browser, browserTools, dependencies, update } from "../lib/install.ts";

const USAGE = `Usage: cli/install.ts [start]

  cli/install.ts start   the line that opens install — run first, it does nothing else
  cli/install.ts         install, stopping at the first thing that fails

Updates the skill when it is a clean checkout of main, installs the skill's and
the dashboard's npm dependencies and the Playwright MCP browser tools (user
scope, attached to the browser cli/browser.ts runs), and starts that browser.
Safe to run again, and running it again is how the skill updates. Uses nothing
outside Node, so it runs before npm install has.`;

const said = (line: string) => console.log(`say: ${line}`);

const [what] = process.argv.slice(2);

if (what === "-h" || what === "--help") {
  console.log(USAGE);
  process.exit(0);
}

if (what === "start") {
  said("Installing takes about 2 minutes, and there's nothing to answer. A browser window opens at the end.");
  process.exit(0);
}

if (what) {
  console.error(`unknown argument '${what}'; try start, or nothing to install`);
  process.exit(1);
}

try {
  console.log(`version: ${update()}`);
  dependencies();
  console.log("dependencies: installed");
  const added = await browserTools();
  console.log(`browser tools: ${added ? "added" : "already added"}`);
  console.log(`browser: ${await browser()}`);
  if (added)
    said(
      "Installed. One last step to start setup: quit Claude Code, open it again, then type /job setup and press Enter.",
    );
  else said("Installed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
