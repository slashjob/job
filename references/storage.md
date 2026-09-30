# Storage

One convention: `job.db` — postings, prospects, staged applications, and the user's whole profile
are rows in it. The filesystem holds only built PDFs, in `resumes/` beside it.

**Both are fixed absolute paths, so `/job` runs identically from anywhere.** Ask the skill where they
are rather than resolving against the working directory:

```bash
cli/paths.ts db resumes
```

**The user can keep several databases** — separate searches, each with its own profile — and
`cli/database.ts` lists, switches and creates them. Every command reads the active one, so switching
mid-task moves the rest of the task with it: switch only when the user asks, and say which one is
now active.

## Queries

`$Q` stands for `cli/q.ts` throughout this skill and its references.

**Read `$Q --schema` before writing SQL** — it documents every table, and its `CHECK`s make an invalid
row impossible to write. One thing it does not say: **`triage` omits `description` on purpose.**
Pull descriptions one at a time, for survivors only: `SELECT * FROM prospects` is almost always a
mistake, and `SELECT * FROM postings` more so.

## The profile

**The user never opens a file and never writes SQL.** Their career history, a corrected fact, a
changed goal: they talk, you write rows. Read before writing — you are merging, not replacing — and
ask about anything genuinely ambiguous: dates, whether work was solo, whether a number was measured
or estimated, since an invented number here becomes a lie on a resume. **Never invent experience**; a
project belongs in `projects` only if the user said it happened. **A correction lands on the row it
corrects** — a wrong number or anything else about a project in its `about`, a wrong title on
`employers` — so there is one place to read and nothing to reconcile. A row that does not
exist means "none", not "never asked".

**Never write run notes or daily summaries to disk.** The database is the record, and a question
about the search — what went quiet, which companies reject fastest — is **answered with a query**, in
the conversation.
