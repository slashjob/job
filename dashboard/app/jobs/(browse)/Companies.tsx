"use client";

import { Briefcase, Newspaper, Target, Users, type LucideIcon } from "lucide-react";
import Actions from "@/components/Actions";
import Glyph from "@/components/Glyph";
import { LinkCard, TitleLink } from "@/components/Linked";
import { GhostLink, Invite, Page, Stamp } from "@/components/ui";
import { describes } from "@/lib/actions";
import { shortDate } from "@/lib/format";
import { companyHref, jobHref, projectHref } from "@/lib/links";
import type { Company, Job } from "@/lib/queries";
import { CompanyMenu, projectsOf } from "../jobs";

const latest = (company: Company) =>
  [
    company.found_on,
    ...company.articles.map((article) => article.published),
    ...company.jobs.map((job) => job.last_updated),
  ]
    .filter((held): held is string => Boolean(held))
    .reduce((top, held) => (held > top ? held : top), "");

const Tally = ({ href, icon, of, what }: { href: string; icon: LucideIcon; of: number; what: string }) =>
  of ? (
    <GhostLink
      href={href}
      icon={<Glyph icon={icon} />}
      aria-label={`${of} ${what}`}
      title={what}
      className="tnum text-sm"
    >
      {of}
    </GhostLink>
  ) : null;

const Match = ({ company }: { company: Company }) => {
  const [first, ...rest] = projectsOf(company.articles);
  if (!first) return null;
  return (
    <GhostLink
      href={rest.length ? `${companyHref(company.id)}#news` : projectHref(first.employer_id, first.project_id)}
      icon={<Glyph icon={Target} />}
      title={`Matches ${[first, ...rest].map((project) => project.project).join(", ")}`}
      className="text-sm"
    >
      <span className="max-w-56 truncate">{first.project}</span>
      {rest.length > 0 && <span className="tnum text-soft">+{rest.length}</span>}
    </GhostLink>
  );
};

const Line = ({ job }: { job: Job }) => (
  <li className="truncate">
    <TitleLink href={jobHref(job.key)}>{job.title}</TitleLink>
  </li>
);

const Full = ({ company }: { company: Company }) => {
  const building = company.articles[0]?.reason;
  const shown = company.jobs.slice(0, 3);
  return (
    <LinkCard
      href={companyHref(company.id)}
      title={company.name}
      stamp={<Stamp>{shortDate(latest(company))}</Stamp>}
      meta={
        <>
          <span className="-ml-1.5 flex items-center">
            <Tally
              href={`${companyHref(company.id)}#news`}
              icon={Newspaper}
              of={company.articles.length}
              what="Articles"
            />
            <Tally
              href={`${companyHref(company.id)}#openings`}
              icon={Briefcase}
              of={company.jobs.length}
              what="Openings"
            />
            <Tally href={`${companyHref(company.id)}#contacts`} icon={Users} of={company.contacts} what="Contacts" />
            <Match company={company} />
          </span>
        </>
      }
      tools={
        <>
          <Actions ids={["contact"]} argument={company.name} />
          <CompanyMenu company={company} />
        </>
      }
    >
      {building && <p className="mt-2 leading-relaxed">{building}</p>}
      {shown.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {shown.map((job) => (
            <Line key={job.key} job={job} />
          ))}
        </ul>
      )}
    </LinkCard>
  );
};

const newest = (left: Company, right: Company) => latest(right).localeCompare(latest(left));

export default function Companies({ companies }: { companies: Company[] }) {
  if (companies.length === 0)
    return (
      <Invite heading="Find jobs that fit you best" detail={describes("search")}>
        <Actions ids={["search"]} />
      </Invite>
    );

  return (
    <Page toolbar={<Actions ids={["search"]} />}>
      <div className="space-y-3">
        {[...companies].sort(newest).map((company) => (
          <Full key={company.id} company={company} />
        ))}
      </div>
    </Page>
  );
}
