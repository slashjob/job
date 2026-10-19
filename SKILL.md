---
name: job
description: Finds companies in the news building what the user has already built, then their openings that fit the search profile, and the people to write to there; on request, builds a tailored resume and fills the application form for the user to submit in the browser. Use for anything about the user's job search: finding companies or openings, writing to someone at a company, tailoring a resume to a posting, applying, their profile, opening the dashboard, the local web app over it, or anything in it that seems broken. `/job install`, then `/job setup`, on first use; `/job help` for the command list.
argument-hint: [install|setup|search [project]|resume [JD|url|key]|apply [key|url]|contact [key|company]|dashboard [start|stop|status]|help]
---

# Job routine

**The deliverable is companies building what the user has already built, and who to write to
there.** A resume and a filled application are made on request, and left in the browser for the
user to review and submit.

## Invariants

Nothing below overrides these.

1. **Never click submit or send.** The user submits every application, and sends every message,
   themselves, in the browser.
2. **Never write an answer the profile does not support.** `NULL` is a hard stop: leave the field
   empty and report it. Never infer a phone number, a salary, or a demographic answer, and never let
   a value they would have chosen come from a fallback — ask. A fact they tell you goes into the
   profile that turn, or the next run asks again.
3. **Answer to the truth, including when it costs the application.** A commitment in the profile is
   a ceiling, not an opening position.
4. **Essays and screening answers are drafted, never auto-accepted.**
5. **Chat output is minimal, and the last message of a turn always opens the same way** — with one
   sentence: what you need from the user, named specifically, which role and which field; or, when
   nothing blocks, what the run came to. Under it, only what is left for them to do or decide, one
   line each. No progress narration, no action transitions, no account of how you got there; the
   database is the record. `/job help`, `/job install` and `/job setup` are the exceptions.
6. **A captcha, or anything else asking for a human, stops the run the moment it appears** — a
   challenge, a "verify you are human" or press-and-hold page, a one-time code sent to their email or
   phone. Never attempt it or route around it: no reload, no new tab, no other copy of the form, no
   next posting. Ask in chat, naming the role and the tab, and wait until they say it is cleared.

## Modes

| Invocation | Runs | Read first |
| ---------- | ---- | ---------- |
| `/job install` | Dependencies, browser tools, and the browser | `references/install.md` |
| `/job setup` | First-run setup | `references/setup.md` |
| `/job` | The same as `/job search` | |
| `/job search [project]` | Find companies in the news building what the user has built, then the openings and the people to write to at each — for every project, or the one named | `references/searching.md`, then `references/boards.md` |
| `/job resume [JD, URL, or key]` | Build a resume for the posting named, or for each one `cli/search.ts openings --unbuilt` lists | `references/resume.md` |
| `/job apply <key or URL>` | Resume, then fill the form, for the one posting named | `references/applying.md` |
| `/job contact [key or company]` | Choose who to write to at a company, about it or a posting, then draft it with the user, left for them to send | `references/contact.md`, then `references/writing.md` |
| `/job dashboard [start\|stop\|status]` | Start the dashboard and open or focus its tab, or stop it | `cli/dashboard.ts --help` |
| `/job help` | Run `cli/help.ts`, then reply with its output verbatim — the user cannot see tool output. No run, no queries, no commentary | |

**If this skill's `node_modules` is missing, run install first; if `~/data/job` does not exist, setup**
— `/job` before either is a no-op.

Two files are not an action and are read when they apply:

| File | Read before |
| ---- | ----------- |
| `references/writing.md` | Writing anything a person reads — resume bullets, cover letter, screening answers, a message to a contact |
| `references/storage.md` | Any query, any write to the profile, anything the user asks about their search |

**Commands are the scripts in this skill's `cli/`, run by absolute path** — the shell does not start
in this directory. Each takes `--help`, and that is the contract: read it before invoking rather
than the source, and never carry a flag from a file here that `--help` does not list.

**Every turn is time the user sits through.** Calls that do not need each other's output go in one
message: a mode's files and the `--help` of every command it runs, read together as it starts; a
browser action and the look that follows it.

**The browser outlives this conversation.** Hand a tab over rather than closing it — never
`browser_close` — and if the Playwright tools reach no browser, run `cli/browser.ts`.

**`browser_navigate` and `browser_click` write the page to a file instead of returning it** — never
read that file. Follow the action, in the same message, with `browser_evaluate` for text you are
reading, `browser_find` for the element you act on next, or `browser_snapshot` only when you need the
whole page. A selector (`#first_name`, `button:has-text("Yes")`) is a valid target anywhere a ref is,
and never goes stale.

**Never navigate a tab this run did not open.** The selected tab may be the user's dashboard or a
filled application, and navigating it loses them. Start each search, and each application, with
`browser_tabs` `new` and its URL; a tab holding a filled form is never navigated again.

## When the user wants something changed

**Generalise to the criterion, never to the posting.** "This one is too senior" is a rule about
seniority, not about that company — but one posting is one data point, and where the words bear two
readings that lead to different edits, **ask which**. A wrong rule in `instructions.text` silently
misjudges every posting after it.

**`instructions.text` is their prose, in their voice.** Add the sentence the complaint earns and
leave the rest alone. Resume wording that was wrong on right facts is this skill's rule, not theirs:
file it with `cli/issue.ts`.

**A complaint that rules a posting out deletes it**, unless they said otherwise; the sentence it
earns in `instructions.text` keeps a search from bringing it back. **A change of criteria leaves every
opening kept under the old ones**: say so, per **Re-judging** in `references/searching.md`.

## When something is broken

When the user says something is broken, or a script fails in a way their setup does not explain,
**diagnose before you answer**, then say plainly which of these it is:

- **Their setup or their answers** — the browser closed, a site they are not signed in to, a
  missing profile answer. Fix it with them; no issue.
- **What it looks for or how it writes** — change it per **When the user wants something changed**.
- **A bug in this skill** — a script that fails on input it should take, a rule here that was
  broken, a site it cannot get through. File it with `cli/issue.ts` rather than patching this
  skill's code: a local patch fixes one copy, and stops `/job install` from ever updating it.

**The issue is written for the developer**: what they did, what happened, what should have
happened, the exact error, and what you ruled out. **Nothing about the user goes in it** — no name,
contact details, employers, resume or profile text; name the job site, not the employer. It opens
for them to check and submit; show its `say:` line verbatim.
