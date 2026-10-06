"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, CircleAlert, Copy, FileText, Search, Users } from "lucide-react";
import Actions, { ActionsMenu } from "@/components/Actions";
import { Command, copyKey, useDiscard } from "@/components/act";
import { useDock } from "@/components/Dock";
import Glyph from "@/components/Glyph";
import Linked, { LinkCard, TitleLink } from "@/components/Linked";
import { OptionsButton, deleteOption, type Option } from "@/components/Options";
import { Badge } from "@/components/Status";
import { Card, Count, Empty, Heading, Invite, Measure, SearchField, Stamp } from "@/components/ui";
import { describes, offered } from "@/lib/actions";
import { places, plural, shortDate, shortPay } from "@/lib/format";
import { assetHref, companyHref, jobHref } from "@/lib/links";
import { SHELVES } from "@/lib/status";
import type { Job } from "@/lib/queries";

type Menu = (job: Job) => Option[];

function nextStep(job: Job) {
  if (job.status === "staged") return job.blocked_on ? ["apply"] : [];
  if (job.status === "shortlisted") return [job.resume ? "apply" : "resume"];
  return [];
}

function where(job: Job) {
  const { lead, more } = places(job.location);
  if (!lead) return job.remote ? "Remote" : null;
  return more ? `${lead} +${more}` : lead;
}

const byFit = (left: Job, right: Job) =>
  (right.score ?? -1) - (left.score ?? -1) || (right.last_updated ?? "").localeCompare(left.last_updated ?? "");

const byRecent = (left: Job, right: Job) => (right.last_updated ?? "").localeCompare(left.last_updated ?? "");

function useMenu(): Menu {
  const { draft } = useDock();
  const drop = useDiscard();
  return (job) => [
    ...offered(job.status).map(({ id }) => ({
      key: id,
      label: <Command id={id} />,
      onPick: () => draft(id, job.key),
    })),
    ...(job.company
      ? [
          {
            key: "network",
            label: <Command id="network" />,
            onPick: () => draft("network", job.company ?? undefined),
          },
        ]
      : []),
    {
      key: "copy",
      label: "Copy job ID",
      icon: <Glyph icon={Copy} size="sm" />,
      onPick: () => copyKey(job.key),
    },
    deleteOption("Delete job", () => drop(job.key)),
  ];
}

const Title = ({ job }: { job: Job }) => <TitleLink href={jobHref(job.key)}>{job.title}</TitleLink>;

const Resume = ({ job, labelled }: { job: Job; labelled?: boolean }) =>
  job.resume ? (
    <a
      href={assetHref("resume", job.key)}
      target="_blank"
      rel="noreferrer"
      aria-label="Open the tailored résumé"
      title="Open the tailored résumé"
      className="inline-flex items-center gap-1.5 text-soft transition-colors hover:text-base-content"
    >
      <Glyph icon={FileText} />
      {labelled && "Resume"}
    </a>
  ) : null;

const Known = ({ job, labelled }: { job: Job; labelled?: boolean }) =>
  job.contacts ? (
    <Link
      href={companyHref(job.company)}
      aria-label={`${plural(job.contacts, "contact")} at ${job.company}`}
      title={`${plural(job.contacts, "contact")} at ${job.company}`}
      className="tnum inline-flex items-center gap-1.5 text-xs text-soft transition-colors hover:text-base-content"
    >
      <Glyph icon={Users} />
      {labelled ? plural(job.contacts, "contact") : job.contacts}
    </Link>
  ) : null;

const More = ({ job, menu }: { job: Job; menu: Menu }) => <OptionsButton what={job.title} options={menu(job)} />;

const Full = ({ job, menu, framed }: { job: Job; menu: Menu; framed?: boolean }) => {
  const pay = shortPay(job.compensation);
  const place = where(job);
  return (
    <LinkCard
      href={jobHref(job.key)}
      title={job.title}
      subtitle={job.company}
      framed={framed}
      meta={
        <>
          {place && <span>{place}</span>}
          {pay && <span className="tnum">{pay}</span>}
          <Resume job={job} labelled />
          <Known job={job} labelled />
        </>
      }
      tools={
        <>
          <Actions ids={nextStep(job)} argument={job.key} />
          <More job={job} menu={menu} />
        </>
      }
    >
      {job.reason ? (
        <p className="mt-3 leading-relaxed">{job.reason}</p>
      ) : (
        <p className="mt-3 text-sm text-soft">Not scored yet.</p>
      )}

      {job.blocked_on && (
        <p className="mt-3 flex items-start gap-2 text-sm text-error">
          <Glyph icon={CircleAlert} className="mt-[0.2em]" />
          <span className="min-w-0">Blocked on {job.blocked_on}</span>
        </p>
      )}
    </LinkCard>
  );
};

const Brief = ({ job, menu, why }: { job: Job; menu: Menu; why?: boolean }) => (
  <>
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
        <h3 className="min-w-0 truncate font-medium">
          <Title job={job} />
        </h3>
        <span title={job.company ?? undefined} className="min-w-0 truncate text-sm text-soft sm:max-w-56 sm:shrink-0">
          {job.company}
        </span>
      </div>
      {job.status === "interviewing" && <Badge>{job.status}</Badge>}
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <Known job={job} />
        {job.status !== "applied" && job.status !== "interviewing" && <Resume job={job} />}
        <Stamp>{shortDate(job.last_updated)}</Stamp>
        <More job={job} menu={menu} />
      </span>
    </div>
    {why && job.reason && <p className="mt-0.5 line-clamp-1 text-sm text-soft">{job.reason}</p>}
  </>
);

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0)
    return (
      <Invite heading="Find jobs that fit you best" detail={describes("all")}>
        <Actions ids={["all"]} />
      </Invite>
    );
  return <Shelves jobs={jobs} />;
}

function Shelves({ jobs }: { jobs: Job[] }) {
  const menu = useMenu();
  const [query, setQuery] = useState("");
  const [unfolded, setUnfolded] = useState<string[]>([]);

  const sought = query.trim().toLowerCase();
  const found = jobs.filter((job) => !sought || `${job.title} ${job.company}`.toLowerCase().includes(sought));

  const shelves = SHELVES.map((shelf) => ({
    ...shelf,
    jobs: found.filter(shelf.holds).sort(shelf.brief && !shelf.folded ? byRecent : byFit),
  })).filter((shelf) => shelf.jobs.length > 0);

  return (
    <Measure>
      <div className="mb-10 flex items-stretch gap-2">
        <SearchField
          icon={<Glyph icon={Search} />}
          aria-label="Search saved jobs"
          placeholder="Search saved jobs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1"
        />
        <ActionsMenu ids={["search", "resume", "apply"]} />
      </div>

      {shelves.length === 0 && <Empty>No jobs match that search.</Empty>}

      {shelves.map((shelf) => {
        const shut = shelf.folded && !sought && !unfolded.includes(shelf.name);
        return (
          <section key={shelf.name} className="mb-12 last:mb-0">
            {shelf.folded ? (
              <Heading>
                <button
                  type="button"
                  aria-expanded={!shut}
                  onClick={() =>
                    setUnfolded((names) =>
                      shut ? [...names, shelf.name] : names.filter((name) => name !== shelf.name),
                    )
                  }
                  className="-ml-1 flex items-center gap-1.5 rounded-field px-1 hover:bg-base-200"
                >
                  <Glyph icon={ChevronRight} className={`transition-transform ${shut ? "" : "rotate-90"}`} />
                  {shelf.name}
                  <Count of={shelf.jobs.length} />
                </button>
              </Heading>
            ) : (
              <Heading>
                {shelf.name}
                <Count of={shelf.jobs.length} />
              </Heading>
            )}

            {!shut &&
              (shelf.brief ? (
                <Card soft tight>
                  {shelf.jobs.map((job) => (
                    <Linked
                      key={job.key}
                      href={jobHref(job.key)}
                      className="rounded-field px-3 py-2.5 transition-colors hover:bg-base-200"
                    >
                      <Brief job={job} menu={menu} why={shelf.folded} />
                    </Linked>
                  ))}
                </Card>
              ) : (
                <div className="space-y-3">
                  {shelf.jobs.map((job) => (
                    <Full key={job.key} job={job} menu={menu} framed={shelf.framed} />
                  ))}
                </div>
              ))}
          </section>
        );
      })}
    </Measure>
  );
}
