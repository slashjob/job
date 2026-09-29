"use client";

import Chips from "@/components/edit/Chips";
import RemoveMenu from "@/components/edit/RemoveMenu";
import { employerHref } from "@/lib/links";
import type { Employer, Project } from "@/lib/queries";
import { Back } from "@/components/ui";
import { Detail, Labeled, Span, editing } from "../parts";

export default function ProjectView({ project, employer }: { project: Project; employer: Employer }) {
  const edit = editing("projects", project);
  const up = employerHref(employer.rowid);

  return (
    <>
      <Back href={up}>{employer.name}</Back>

      <Detail
        head={edit("name", { placeholder: "Name this project" })}
        tools={<RemoveMenu table="projects" rowid={project.rowid} name={project.name} noun="project" then={up} />}
      >
        <div className="mt-1">
          <Span table="projects" row={project} />
        </div>

        <Labeled label="About" className="mt-5">
          {edit("about", {
            kind: "area",
            preview: true,
            placeholder: "What you built, what changed because of it, and the numbers you can back up.",
          })}
        </Labeled>

        <Labeled label="Technologies" className="mt-5">
          <div className="px-1.5">
            <Chips
              table="project_technologies"
              column="technology"
              rows={project.technologies}
              seed={{ project_id: String(project.rowid) }}
              placeholder="add one, press enter"
            />
          </div>
        </Labeled>
      </Detail>
    </>
  );
}
