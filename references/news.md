# News

Companies in the news building something the user has already built, found before they post a
role. The deliverable is a list of leads: the company, what it is building, and the project of the
user's that did the same. Whether to reach out is theirs.

## Queries

**One per project, written once and kept.** Write only for the projects `cli/news.ts topics --stale`
lists; with none listed, go straight to the search. The user reads and edits these on the News page,
so each is the product or technique the project is, in the words a reporter would use rather than
the project's own name: `"route optimization" AND (freight OR logistics)`, not `DispatchPlanner v2`.
A project that is work `instructions.text` says the user does not want is dropped, not written.

**A project named is the only one written and searched**, with `search --project`.

**Every page costs the user a NewsData credit, from a daily allowance.** One page per query. A query
that returns mostly noise is too broad — narrow it rather than reading further pages.

## Judging

**Done by a Haiku subagent**, never by this run: the Agent tool with `model: "haiku"`, handed this
file's path, the `cli/news.ts` path, and `instructions.text`. It reads the projects with
`cli/news.ts topics --json` and the articles with `cli/news.ts pending --json`, follows this
section, and records every verdict with `cli/news.ts judge`.

**A lead is one named company building what one project built** — the product, or the technique
it rests on. The strongest is a company announcing that it is building, launching or raising money
for it. Everything else is noise:

- A company using AI, rather than building the thing
- Market commentary, listicles, opinion, a research paper with no company behind it
- A company too large for a note from a stranger to reach someone who decides — big tech, a public
  company
- An article whose title and summary do not say what the company builds. Judging is once: a guess
  becomes a lead the user spends a message on

**The match is the most specific project**, and `reason` is one line: what the company is building,
and what in the project did the same.

## Hand them over

Under the opening sentence, one line per lead: the company, what it is building, and the project.
The next step is theirs to choose: `/job network` for the company, then `/job message` to a person
there.

## Writing to a lead

Read by `references/message.md` when the purpose is a company in the news.

**There is no posting, so there is no recruiter to write to.** At a small company, a founder or
whoever leads engineering.

**The purpose**: what the article reported they are building, the project of the user's that built
the same, and the one thing in its row that shows it — then ask whether they are hiring for it, or
would talk. Never imply an opening exists.

**Once the message is typed, `cli/news.ts mark <article_id> messaged`**, so the lead stops coming back.
