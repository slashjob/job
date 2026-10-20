"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText } from "lucide-react";
import { copyKey, useDiscard, usePass } from "@/components/act";
import Glyph from "@/components/Glyph";
import { TitleLink } from "@/components/Linked";
import { DeleteMenu, OptionsButton, deleteOption, useActionOption, type Option } from "@/components/Options";
import { Stamp } from "@/components/ui";
import { places, shortDate, shortPay } from "@/lib/format";
import { assetHref, jobHref, projectHref } from "@/lib/links";
import type { Article, Company, Job } from "@/lib/queries";

export function where(job: Job) {
  const { lead, more } = places(job.location);
  if (!lead) return job.remote ? "Remote" : null;
  return more ? `${lead} +${more}` : lead;
}

export const Resume = ({ job, labelled }: { job: Job; labelled?: boolean }) =>
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

function useJobMenu() {
  const actionOption = useActionOption();
  const drop = useDiscard();
  return (job: Job): Option[] => [
    ...["resume", "apply", "contact"].map((id) => actionOption(id, job.key)),
    {
      key: "copy",
      label: "Copy job ID",
      icon: <Glyph icon={Copy} size="sm" />,
      onPick: () => copyKey(job.key),
    },
    deleteOption("Delete job", () => drop(job.key)),
  ];
}

export function JobMenu({ job }: { job: Job }) {
  const menu = useJobMenu();
  return <OptionsButton what={job.title} options={menu(job)} />;
}

export function CompanyMenu({ company }: { company: Pick<Company, "id" | "name"> }) {
  const pass = usePass();
  return <DeleteMenu what={company.name} label="Delete company" onPick={() => pass(company.id)} />;
}

export function PassCompany({ company }: { company: Pick<Company, "id" | "name"> }) {
  const pass = usePass();
  const router = useRouter();
  return (
    <DeleteMenu
      what={company.name}
      label="Delete company"
      onPick={() => pass(company.id).then(() => router.push("/jobs"))}
    />
  );
}

export const JobRow = ({ job }: { job: Job }) => {
  const pay = shortPay(job.compensation);
  const place = where(job);
  return (
    <div className="flex items-center gap-3">
      <h3 className="min-w-0 flex-1 truncate font-medium">
        <TitleLink href={jobHref(job.key)}>{job.title}</TitleLink>
      </h3>
      <span className="flex shrink-0 items-center gap-3 text-sm text-soft max-sm:hidden">
        {place && <span>{place}</span>}
        {pay && <span className="tnum">{pay}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Resume job={job} />
        <Stamp>{shortDate(job.last_updated)}</Stamp>
        <JobMenu job={job} />
      </span>
    </div>
  );
};

export const projectsOf = (articles: Pick<Article, "projects">[]) =>
  articles
    .flatMap((article) => article.projects)
    .filter((project, at, all) => all.findIndex((other) => other.project_id === project.project_id) === at);

export function Matches({ articles }: { articles: Pick<Article, "projects">[] }) {
  const projects = projectsOf(articles);
  if (!projects.length) return null;
  return (
    <p className="mt-2 text-sm text-soft">
      Matches{" "}
      {projects.map((project, at) => (
        <Fragment key={project.project_id}>
          {at > 0 && ", "}
          <Link href={projectHref(project.employer_id, project.project_id)} className="link text-base-content">
            {project.project}
          </Link>
        </Fragment>
      ))}
    </p>
  );
}
