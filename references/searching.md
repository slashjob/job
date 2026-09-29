# Searching

Finding the openings and judging them, in one pass. **You do the searching** in the browser: browse
the boards and careers sites worth searching, score each posting as you read it, and hand the
survivors to `cli/search.ts insert`.

Nothing here costs money or needs a key, and there is no list of employers to maintain: reach is
whatever you search for.

## What to search for

**Nothing about what to search for is baked into this skill.** The terms come off `cli/score.ts
instructions` and the profile — read both, then build the queries. If something belongs in the search
and is in neither, that is the gap: decide whether it is a profile fact or a line the user should
add to their instructions, and ask.

| Part of a query | Comes from |
| --------------- | ---------- |
| the title terms | the titles named in `instructions` — the same words the judgement reads |
| where | `identity.location`, and what the instructions say about where they will work |
| how far back | the user — ask before the first run |
| what to leave out | the titles and employers the instructions rule out |

**The terms match the title, and nothing else.** Say them the way a title says them, short and
literal, and run several narrow queries rather than one broad one.

**Do not narrow location past what the user actually said.** A posting open in both London and New
York is one a US-based user still wants to see.

## What the judgement reads

`cli/score.ts instructions` prints all of it: their work history, the standing facts off `identity`,
and `instructions.text`, their own prose.

**The history is what fit is measured against; the prose is only what they want.** A posting can
satisfy every preference and still be a role they would not be called for, or one they are years
past. Read what the JD asks for — the stack, the domain, the seniority — against the projects rather
than against the title they hold today: a project shipped in the JD's stack outweighs a job title
that merely sounds like the posting. Where the JD names years, the prose says how far a stretch may
go and the history says where they stand; neither number is yours to invent.

**The prose carries no numbers.** It says in its own words what counts for how much, what is a hard
stop, and what the search should ask for. Nothing is added up; the score is a judgement those inform.
It is theirs, so when a score and the prose disagree **the prose is right and the score is wrong** —
do not quietly compensate for prose you would have written differently.

## Reading a posting

**Read a page as text, not as a snapshot.** A snapshot carries the site's navigation, footer and
every ref, and each turn after it carries them too. On a results page, `browser_evaluate` a function
that returns the listings as JSON — title, company, location, link; on a posting, return
`(document.querySelector('main') ?? document.body).innerText`. Snapshot only when the text comes back
empty or wrong.

1. **Read titles and locations first, and open only what survives that.** Opening a hundred postings
   to learn that eighty are the wrong role is the expensive way to read a title.
2. **Open the posting and read the description before judging it.** Judging off a title is the
   failure this pass exists to prevent — a "Software Engineer" JD that is 80% LLM work beats a
   "Senior AI Engineer" req that is really data plumbing. A posting with no description cannot be
   judged at all, so leave it out rather than guessing.
3. **Weigh the JD's requirements before reading the history against them.** Decide what the posting
   actually requires, and how much, from its own wording and structure — must-have language, the
   Requirements section versus Preferred — then check each against the projects. Weighing after
   matching drifts toward rating what they have as important and what they lack as minor. A weight
   the JD does not state is a guess, and a guess never makes a missing requirement decisive: that
   error costs an application they should have made.
4. **Apply the hard stops first.** One of theirs is a zero regardless of how well the rest reads, and
   no amount of good elsewhere trades against it.

**Drop on sight, without storing:** the expired, the reposted staffing listing, the role plainly in
the wrong field or seniority, and anything the instructions rule out by name. **A blank compensation
is not a low one** — most postings state none, and an unstated band is a question for later, not a
reason to drop.

## The scale

The `shortlist_threshold` row in `settings` — 7 by default — is the only number the app owns. So
the live question between a 6 and a 7 is not how good the posting is but **whether they should
spend an hour of their morning applying to it.**

Every other gradation comes off their prose, which already ranks what costs nothing, what is a mark
against, and what is a hard stop. Read the ranking there rather than inventing a rubric here.

**Score everything you keep, the rejects included.** An unscored row sits at `new` and comes back
tomorrow, so keeping a posting without judging it is a decision paid for again every morning.

## The reason

**Two short sentences, and stop.** The one thing that drove the score, in the JD's words, and the
one thing working against it. It is read by someone deciding at a glance whether to trust the
shortlist, so a paragraph is a worse reason than a line, not a more thorough one.

Summarising the posting is not judging it — they can read the JD. Cut every clause that does not
change the number: the title, the stage of the company, the stack, the caveats about how soft a gate
is. A reason that would fit any posting is a score that was not made.

Where the score turns on something the posting never states — no compensation, no location — score
on a stated assumption and say so in the reason.

## Hand them over

Pipe the postings to `cli/search.ts insert --file -` as a JSON array, each with its `score` and
`reason` — no file to write first.

**Search in the foreground and do not end the turn mid-run.** The user is otherwise left holding a
routine that has not searched or shortlisted anything. This is the slow part of the routine, and
sitting through it is the job.

Insert as you go rather than at the end — a run cut short by a captcha or a closed laptop keeps
everything already inserted.

## Dedupe

`insert` drops any posting already held, matched by key or by normalized company + title. **If it
collapses two roles that are genuinely different** — the same title twice at one employer,
different teams — the line it prints about the drop is the only warning. Give the second one a title that tells them
apart and insert it again.

## Re-judging

**Nothing re-scores itself.** Editing `instructions.text`, or adding the employer or project that
changes what they can be considered for, leaves every existing score where it was, and the shortlist
stays built on criteria that no longer apply. After either change, clear the scores you want judged
again — and clear the status with them, because a row left `shortlisted` with a NULL score stays
shortlisted:

```bash
$Q "UPDATE postings SET score=NULL, reason=NULL, status='new'
    WHERE status IN ('new','skipped','shortlisted')"
```

Rows already past triage — staged, applied, interviewing — are history, not candidates. Leave them.
`cli/score.ts` re-judges what is already stored without going back to the boards.

## Traps

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| A search returns almost nothing | The terms do not match how titles are worded | Widen the terms, not the window |
| Several pages in a row come back empty | The board is asking for a person, and an empty page reads exactly like a quiet market | Stop and check the count against the queries run; a block is not a result |
| A 403 where a navigation worked | Something did `fetch()`/XHR instead of navigating; boards throttle those even in the same session | Navigate, the way a person would |
| The shortlist is too big or too small | The threshold, not the scores | The `shortlist_threshold` row in `settings` |
