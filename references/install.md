# Install

The user may not be technical, and may be in the desktop app, an editor, or a terminal. **Show each `say:` line verbatim, and say nothing else** —
no progress, no summary, no commands they don't have to type. The scripts own the wording and the
time estimates, so every user hears the same install. The skill lives in `~/.claude/skills/job`, and
`cli/` below means the one there.

**1. Check `node -v` before any script.** Every script is TypeScript that Node 22.18 or newer runs
directly, so an older Node fails with an error that never names the version. If it is older or
missing, say exactly this and stop:

> One thing to install first, which takes about 5 minutes:
>
> 1. Go to https://nodejs.org and click the big **Download** button.
> 2. Open the file it downloads, and click **Continue** or **Next** until it says it's finished.
> 3. Quit Claude Code, open it again, then type `/job install` and press Enter.

**2. Run `cli/install.ts start`, then `cli/install.ts`.** If it stops, fix what it names yourself
and run it again — it is safe to repeat. Bring the user in only for a step no one else can take, and
then give them the exact keys to press.

**3. Setup follows here only if the Playwright browser tools are among your tools.** If they are, go
straight into `/job setup`. If they are not and the script gave no `say:` line about it, say:

> One last step to start setup: quit Claude Code, open it again, then type `/job setup` and press
> Enter.
