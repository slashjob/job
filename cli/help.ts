#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { ACTIONS } from "../lib/core/actions.ts";

const ELSEWHERE = [{ id: "help", argument: "", does: "this message" }];

const NOTES = [
  "`/job` alone runs `search`",
  "run `/job install`, then `/job setup` — every other command is a no-op until both have run",
  "nothing is submitted or sent — you review the filled form, or the drafted message, and send it yourself in the browser",
  "a field your profile does not answer is left empty and reported, never guessed",
  "everything lives in ~/data/job/job.db",
  "keep a separate search with its own profile in another database — create or switch one from the dashboard's database menu",
  "a search reads the news for companies building what you have built, then looks up their openings and who to write to there — see references/searching.md",
  "`cli/browser.ts` starts the browser the actions drive; it stays open between them, so a captcha or a half-filled form waits for you",
  "ask about your search in plain English — it is answered with a query",
  "something broken? say so — if it's a bug, Claude writes up a GitHub issue for you to submit",
];

const called = ({ id, argument }: { id: string; argument: string }) => (argument ? `${id} ${argument}` : id);

console.log(`job — find companies in the news building what you have built, with their openings and who to write to; tailor a resume, and fill the application for you to submit.

usage: \`/job [command] [argument]\`

commands:
`);
for (const command of [...ACTIONS, ...ELSEWHERE]) console.log(`- \`${called(command)}\` — ${command.does}`);

console.log("\nnotes:\n");
for (const note of NOTES) console.log(`- ${note}`);
