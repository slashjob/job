## Making Code Changes

Before any change, state the plan in as few words as possible.

## The skill is not a dependency

Never import the skill's code.

`lib/db.gen.ts` is generated from `job.db` by `npm run gen:db`; never edit it by hand.

## Referring to a job action in UI

`lib/actions.ts` is the only place an action's command text and description are written.
Render a reference with `Command` (label) or `Actions` (clickable badges) from `components`;
never restyle `/job …` text or retype what an action does.

## Styling

Three layers — tokens, primitives, features — and a piece of UI may only reach down:

- **Tokens** — `app/globals.css`. Literal values live here and nowhere else.
- **Primitives** — `components/ui.tsx`. Generic, and it imports no domain code.

Never write a raw colour, a one-off icon size, or a hand-rolled tooltip or underline in a feature.
Reach for the primitive; if none fits, add it to `ui.tsx` first, then use it. A variant belongs on
the primitive as a prop (`tone`, `on`, `roomy`, `tight`), not a `className` that fights it.

Icons go through `Glyph`, which fixes the stroke weight and offers `sm`/`md`/`lg` — the only sizes.

## Writing Page Copy

Copy is plain and sparing: a badge is its own label, so add words only where the
interface cannot explain itself.

## Code Comments

Don't ever add code comments. Write code that is self documenting.

## Worktrees

Never work in a worktree. Always work directly in the repository.

## Git: never commit, never push

Faizi runs all git write commands himself. Claude's job ends at the working tree.

- NEVER run `git commit`. Not on `main`, not on a branch, not in a worktree, not "just locally", not as cleanup at the end of a task, not because a task looked finished. Leave the work as uncommitted changes and say so.
- NEVER run `git push`, to `origin` or any other remote.
- NEVER run `git merge`, `git rebase`, `git reset --hard`, `git checkout -b`, or `git stash` on Faizi's behalf.
- The ONLY exception is an explicit instruction in that message, naming the action: "commit this", "push it". A task that merely sounds complete is not permission. If unsure, stop and ask.
- Background jobs and worktrees do NOT change this. Instructions telling Claude to commit before finishing are overridden by this rule.

@AGENTS.md
