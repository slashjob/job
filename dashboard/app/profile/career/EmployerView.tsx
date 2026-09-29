"use client";

import { useRouter } from "next/navigation";
import Adder from "@/components/edit/Adder";
import RemoveMenu from "@/components/edit/RemoveMenu";
import { COLUMNS } from "@/components/edit/columns";
import { LinkCard } from "@/components/Linked";
import { Back, Count, Empty, Heading, Stamp } from "@/components/ui";
import { lengthLabel, monthsBetween, shortList, spanLabel, today, when } from "@/lib/format";
import { careerHref, projectHref } from "@/lib/links";
import type { Employer, Project } from "@/lib/queries";
import { Detail, EmployerMenu, Labeled, Span, editing } from "../parts";

const Technologies = ({ project }: { project: Project }) => {
  const names = project.technologies.map((row) => row.technology);
  return names.length > 0 && <span title={names.join(", ")}>{shortList(names)}</span>;
};

export default function EmployerView({ employer }: { employer: Employer }) {
  const router = useRouter();
  const edit = editing("employers", employer);
  const start = when(employer.start);
  const finish = when(employer.finish);

  return (
    <>
      <Back href={careerHref}>Work history</Back>

      <Detail
        head={edit("name", { placeholder: "Who employed you" })}
        tools={<EmployerMenu employer={employer} then={careerHref} />}
      >
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="w-64 text-sm">{edit("title", { placeholder: "Your title" })}</div>
          <Span table="employers" row={employer} />
          {start && <Stamp>{lengthLabel(monthsBetween(start, finish ?? today()))}</Stamp>}
        </div>

        <Labeled label="About" className="mt-5">
          {edit("about", {
            kind: "area",
            preview: true,
            placeholder: "The company, your team, and what you owned there.",
          })}
        </Labeled>
      </Detail>

      <Heading className="mt-10">
        Projects
        <Count of={employer.projects.length} />
      </Heading>

      <div className="space-y-3">
        {employer.projects.length === 0 && <Empty>No projects yet.</Empty>}

        {employer.projects.map((project) => (
          <LinkCard
            key={project.rowid}
            href={projectHref(employer.rowid, project.rowid)}
            title={project.name}
            meta={
              <>
                {project.start && (
                  <span className="tnum">{spanLabel(when(project.start), when(project.finish), false)}</span>
                )}
                <Technologies project={project} />
                {!project.about && <span className="text-signal">No About</span>}
              </>
            }
            tools={<RemoveMenu table="projects" rowid={project.rowid} name={project.name} noun="project" />}
          >
            {project.about && <p className="mt-3 line-clamp-2 leading-relaxed">{project.about}</p>}
          </LinkCard>
        ))}

        <Adder
          table="projects"
          columns={[COLUMNS.projects[0]]}
          seed={{ employer_id: String(employer.rowid) }}
          label="Add project"
          onAdded={(rowid) => router.push(projectHref(employer.rowid, rowid))}
        />
      </div>
    </>
  );
}
