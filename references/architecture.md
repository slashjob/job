# The app

Read before changing the code. Nothing here is needed to run an action.

Node 22.18 or newer runs the TypeScript directly, so there is nothing to build.

## Modules

**One module per action, under `cli/`.**

**One app, one language.** `lib/core/` is what everything shares — the schema, the action roster,
paths and connect, and everything the browser and the resume build need beneath one action.
Beside it sits one file per action that has logic of its own: **`lib/x.ts` decides and returns a
value, `cli/x.ts` parses argv and prints it**. `sql/logic.sql` is applied on every connect.

## Adding or changing an action

**`lib/core/actions.ts` is the only place in code an action is declared**, and the Modes table in
`SKILL.md` is the only place in prose. Its `does` and `argument` render `cli/help.ts`, and its
`accepts` is the statuses a posting must be in for that action to be allowed.

## The search half

**No module knows any board's payload shape, and none should be added.** Searching is browsing, done
by the model against `references/boards.md`; the app's whole part is `cli/search.ts insert`, which
parses what it is handed into `Posting` rows and drops the openings already held. A new board needs
nothing here.

## Changing the schema

**`lib/core/schema.ts` is the only place a column is declared.** `lib/core/ddl.ts` renders the DDL
from it on every connect — the type, nullability, every `CHECK`, the indexes, and the views whose
body is just a column list. There is no generated file to keep in step, but an existing database is not
migrated: the next connect refuses it and says how. Triggers and the views with real SQL in them live in `sql/logic.sql`, which is hand-written and
concatenated onto the rendered DDL.

Dropping a column or a table drops what it holds, and no later run can bring it back. **Save the rows
first, and tell the user what you saved and where** — the judgment about whether they are worth
keeping is theirs, not yours.
