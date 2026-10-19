# Searching

One pass, in four steps: **the news, the companies in it, their openings, and the people to write
to there.** The deliverable is companies building what the user has already built, each with what
was found about it. **You do the searching** in the browser; nothing here costs money or needs a key.

**Search in the foreground and do not end the turn mid-run.** The user is otherwise left holding a
routine that has found nothing. This is the slow part of the routine, and sitting through it is the
job. Store as you go — a run cut short by a captcha or a closed laptop keeps everything already
stored.

## 1. The news

**Search Google News in the browser**:
`https://news.google.com/search?q=<terms>+when:7d&hl=en-US&gl=US&ceid=US:en`. Read each results page
as JSON with `browser_evaluate` — headline, source, time, link, image — and store every article with
`cli/search.ts articles`. Judging decides what is noise, not the search.

**Terms come off `cli/search.ts projects`, fresh each run, never saved.** Each is the product or
technique the project is, in the words a reporter would use rather than the project's own name:
`"route optimization" freight`, not `DispatchPlanner v2`. Several narrow searches per project beat
one broad one. A project that is work `instructions.text` says the user does not want is not
searched. **A project named is the only one searched.**

**A company of any size is in scope**, from a seed round to a public company launching a product.
What matters is that it is building the thing.

## 2. Judging the news

**Done by a Haiku subagent**, never by this run: the Agent tool with `model: "haiku"`, handed this
file's path, the `cli/search.ts` path, and `instructions.text`. It reads the projects with
`cli/search.ts projects --json` and the articles with `cli/search.ts pending --json`, follows this
section only, and records every verdict with `cli/search.ts judge`.

**A lead is one named company building what one project built** — the product, or the technique it
rests on. The strongest is a company announcing that it is building, launching or raising money for
it. Everything else is noise:

- A company using AI, rather than building the thing
- Market commentary, listicles, opinion, a research paper with no company behind it
- An article whose title and summary do not say what the company builds. Judging is once: a guess
  becomes a company the user spends a morning on

**The company is named the way it names itself**, without the article's framing — `judge` files a
second article about it under the same company, by name. **The match is the most specific
project**, and `reason` is one line: what the company is building, and what in the project did the
same.

## 3. Openings

For every company `cli/search.ts companies --due` lists, **find its own website first** and confirm
it is the company the article names — a name alone matches several, and the wrong one turns up real
openings somewhere else. Where the two cannot be matched, leave the company and say so.

**Read every opening at the company, then judge which fit.** Its careers page, or the ATS the page
embeds, is where to read; `references/boards.md` is for a company whose openings live elsewhere.
Store the ones that fit with `cli/search.ts insert --company <id> --website <url>` — and with an
empty array where none does, which marks the company searched all the same.

**Do not narrow location past what the user actually said.** A posting open in both London and New
York is one a US-based user still wants to see.

### What the judgement reads

`cli/search.ts instructions` prints all of it: their work history, the standing facts off `identity`,
and `instructions.text`, their own prose.

**The history is what fit is measured against; the prose is only what they want.** A posting can
satisfy every preference and still be a role they would not be called for, or one they are years
past. Read what the JD asks for — the stack, the domain, the seniority — against the projects rather
than against the title they hold today: a project shipped in the JD's stack outweighs a job title
that merely sounds like the posting. Where the JD names years, the prose says how far a stretch may
go and the history says where they stand; neither number is yours to invent.

**The prose carries no numbers.** It says in its own words what counts for how much, what is a hard
stop, and what the search should ask for. Nothing is added up; whether an opening is kept is a
judgement those inform. It is theirs, so when your judgement and the prose disagree **the prose is
right** — do not quietly compensate for prose you would have written differently.

### Reading a posting

**Read a page as text, not as a snapshot.** A snapshot carries the site's navigation, footer and
every ref, and each turn after it carries them too. On a results page, `browser_evaluate` a function
that returns the listings as JSON — title, company, location, link; on a posting, return
`(document.querySelector('main') ?? document.body).innerText`. Snapshot only when the text comes back
empty or wrong.

1. **Read titles and locations first, and open only what survives that.** Opening every posting at
   a company to learn that most are the wrong role is the expensive way to read a title.
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

### Keep or drop

**Keep an opening only if they should spend an hour of their morning applying to it.** That is the
whole question; nothing is rated, and nothing kept is ranked against anything else. Their prose
already says what costs nothing, what is a mark against, and what is a hard stop — read the answer
there rather than inventing a rubric here.

Where the call turns on something the posting never states — no compensation, no location — keep it
on a stated assumption and say so when handing it over.

## 4. People

For every company `--due` lists with no contacts, find the one or two worth writing to by
`references/contact.md`, **Who** and **How to reach them**, and store them with `cli/search.ts
contacts`.

## Hand them over

Under the opening sentence, one line per company this run turned up: the company, what it is
building, who to write to, and any opening kept. The next step is `/job contact` with a
company, or `/job apply` on an opening.

## Dedupe

`insert` drops any posting already held, matched by key or by the same title at the same company. **If it
collapses two roles that are genuinely different** — the same title twice, different teams — the
line it prints about the drop is the only warning. Give the second one a title that tells them apart
and insert it again.

## Re-judging

**Nothing re-judges itself.** Editing `instructions.text`, or adding the employer or project that
changes what they can be considered for, leaves every opening kept under criteria that no longer
apply. After either change, say so, and with the user's go-ahead read the kept openings again with
`cli/search.ts openings` and `show`, and delete the ones that no longer fit.

## Traps

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| The news returns almost nothing | The terms are the project's words, not a reporter's | Widen the terms, not the window |
| Several pages in a row come back empty | The site is asking for a person, and an empty page reads exactly like a quiet market | Stop and check the count against the queries run; a block is not a result |
| A 403 where a navigation worked | Something did `fetch()`/XHR instead of navigating; sites throttle those even in the same session | Navigate, the way a person would |
