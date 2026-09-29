#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { Command } from "commander";

import { ENDPOINT, PORT, ensure, focus, running, stop } from "../lib/core/dashboard.ts";
import { fail, guard } from "./kit.ts";

new Command("cli/dashboard.ts")
  .description(
    `Start or stop the dashboard, the local web app over this skill's database.

  cli/dashboard.ts          start it if it is not up, then open or focus its tab in the skill's browser
  cli/dashboard.ts start    the same
  cli/dashboard.ts stop     stop it if it is running
  cli/dashboard.ts status   say whether it is up

It stays running after this process exits, the same way cli/browser.ts leaves the browser
running — only \`stop\` shuts it down.`,
  )
  .argument("[what]", "start, stop, status, or nothing to start it")
  .action(
    guard(async (what: string | undefined) => {
      if (what === "status") {
        const up = await running();
        return console.log(up ? `up on ${ENDPOINT}` : `nothing on port ${PORT}`);
      }

      if (what === "stop") {
        return console.log(stop() ? "stopped" : "not running");
      }

      if (what && what !== "start") fail(`unknown argument '${what}'; try start, stop, or status`);

      const { started } = await ensure();
      const { opened } = await focus();
      console.log(
        `${started ? "started" : "already running"} on ${ENDPOINT}; ${opened ? "opened a tab" : "focused its tab"}`,
      );
    }),
  )
  .parseAsync();
