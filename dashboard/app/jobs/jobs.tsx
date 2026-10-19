"use client";

import { useRouter } from "next/navigation";
import { Copy, FileText } from "lucide-react";
import { Command, copyKey, useDiscard, usePass } from "@/components/act";
import { useDock } from "@/components/Dock";
import Glyph from "@/components/Glyph";
import { TitleLink } from "@/components/Linked";
import { DeleteMenu, OptionsButton, deleteOption, type Option } from "@/components/Options";
import { Stamp } from "@/components/ui";
import { places, shortDate, shortPay } from "@/lib/format";
import { assetHref, jobHref } from "@/lib/links";
import type { Company, Job } from "@/lib/queries";

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
  const { draft } = useDock();
  const drop = useDiscard();
  return (job: Job): Option[] => [
    ...["resume", "apply", "contact"].map((id) => ({
      key: id,
      label: <Command id={id} />,
      onPick: () => draft(id, job.key),
    })),
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
  const { draft } = useDock();
  const pass = usePass();
  return (
    <OptionsButton
      what={company.name}
      options={[
        { key: "contact", label: <Command id="contact" />, onPick: () => draft("contact", company.name) },
        deleteOption("Delete company", () => pass(company.id)),
      ]}
    />
  );
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
