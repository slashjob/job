# Networking

People the user can reach on LinkedIn at the companies they applied to, most of whom they have never
met: 1st and 2nd-degree connections, members of groups they are in, and people who went to a
school they went to. The deliverable is a list of people and the path to each; whether to reach out,
and to whom, is theirs.

**Never contact anyone, and never open a person's profile.** No connection request, message, follow
or reaction — and LinkedIn tells a person who viewed their profile, so a profile opened here is the
user turning up in a stranger's notifications at a company they are waiting to hear from. Everything
this action needs is on a list page.

**LinkedIn restricts accounts that browse like a script, and the account is the user's own.** One
tab, opened by this run and reused; one company at a time; list pages only, and no further down one
than its first two pages. A sign-in page is theirs to get past: ask, naming the tab, and wait.

## Which companies

`cli/network.ts companies`, or with the company named in the invocation. Each is looked up again on
every run: people join, leave and connect between runs.

## Finding the company

Search LinkedIn for the company and open its page. **A name alone matches several companies**, and
the wrong one returns real people who work somewhere else — nothing about the result looks wrong.
Confirm it against the posting: the website on the LinkedIn page and the employer the posting's URL
or description names. Where the two cannot be matched, report the company as not found rather than
choosing the nearest.

**Where the posting came through a staffing firm, the company to look up is the client**, if the
description names one. The firm's own staff are not a way in.

## Who is there

The company page's People tab lists who works there, each marked with how the user is connected.
**Narrow it with the filters on the page, not by guessing URL parameters** — a wrong one silently
returns the unfiltered list.

| Connection | What to take |
| ---------- | ------------ |
| 1st | Everyone: name and title |
| 2nd | Name, title, and **the mutual connection LinkedIn names** — that person is the introduction, and a 2nd without one is no more reachable than a stranger |
| Shared group | Name, title, and the group. Their groups are listed at `linkedin.com/groups` |
| Shared school | Name, title, and the school, spelled as `education.institution` spells it. Only schools in `education` count |

**A person reached two ways is one contact carrying both** — a 2nd who is also an alum has the
introducer and the school.

**3rd-degree connections are not tracked**: not stored, not counted.

**Closest to the role means the team the role sits in and the people who hire for it** — the same
function, its managers, recruiters. At a large employer a 2nd-degree or alumni list can run to a
page or more, and reading it out buries the two names that matter: past a page, take the closest.

**If a connection type cannot be read without opening profiles one by one, say it could not be
checked.** A company reported with no group members must mean none were found, not that none were
looked for.

## Hand them over

`cli/network.ts insert` after each company rather than at the end, so a run cut short keeps what it
read. **It replaces everyone held for that company**: hand over the whole company in one call, and
only once the company is read through — a partial list silently deletes the people it leaves out.
A company with nobody is still handed over, empty; one that was not found is not handed over at all.

Under the opening sentence, one line per company with someone in it, strongest path first: 1st, then
2nd with who connects them, then group.

## Adding a quirk

What LinkedIn turned out to need — where a filter lives, what a list page hides — earns a line
here once it is driven.
