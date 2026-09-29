# Boards

Where to look. The boards below are the ones with known quirks, not a fence: **search any established
job board or careers site that seems likely to hold the roles the instructions ask for** — the big
general boards, a field's own niche board, an employer's careers page.

**Stop and ask before going further on a site you cannot vouch for** — one that wants paying, wants
an account or personal details before it shows a posting, has no identifiable company behind it, or
carries postings copied from elsewhere with an apply link pointing off to somewhere unrelated. The
user's real name and history reach whatever they apply through, so whether an unfamiliar site is
safe is theirs to decide.

**The employer's own page is the posting; a board is a way of finding it.** Wherever a listing links
out to the employer's careers site or ATS, follow it, and read, key and later apply there. The board's
copy is often truncated or stale, and the employer's is the one the application goes through.

**The key is `<source>:<id>` from where the posting lives** — `greenhouse:<id>`, `lever:<id>`,
`<employer>:<id>` off their own careers site — and the board's own only when the role lives nowhere
else. A role found on three boards then collapses to one row on its own. If no stable id can be
found, skip the posting rather than inventing a key.

## `indeed`

The broad sweep, and where most of the volume is. Good for titles that thousands of employers post
under the same words — engineering, nursing, ops, support. Bad for anything niche: the sponsored
placements crowd out the real postings, and staffing firms repost the same role under several names.

- Queries are `https://www.indeed.com/jobs?q=…&l=…&fromage=…`
- **Scope `q` with `title:"…"`.** A bare term matches the body text and returns off-target results.
- **Take remote through `l=Remote`.** The `sc=0kf:attr(DSQF7)` filter documented elsewhere makes the
  navigation time out.
- **Do not paginate.** `&start=10` is the request shape that draws a block. More queries, one page
  each.
- The id is the `jk` in the posting URL, so a role Indeed hosts itself is `indeed:<jk>`.

## Google Jobs

The jobs panel in Google Search pulls from LinkedIn, Greenhouse, Lever, ZipRecruiter and employers'
own sites at once. Good for reach no single board has, and for roles posted only to an employer's
own ATS. Bad as a place to read from: the panel truncates the description, the same role shows up
several times through different sources, and it draws a bot check faster than anything else here.
Google mints no id of its own, so every key comes from the destination.

- Search `https://www.google.com/search?q=<terms>&ibp=htl;jobs`
- **Set the date and remote filters with the chips on the page, not by guessing URL parameters.**
  The ones Google accepts are undocumented and change; a wrong one silently returns an unfiltered
  page, which reads exactly like a wide search.

## Adding one

A board that turned out to have quirks worth knowing earns a section here: what it is good for,
what it is bad for, how a query is built, and what makes a stable id.
