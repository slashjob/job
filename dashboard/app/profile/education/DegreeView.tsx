"use client";

import RemoveMenu from "@/components/edit/RemoveMenu";
import { educationHref } from "@/lib/links";
import type { Degree } from "@/lib/queries";
import { Back } from "@/components/ui";
import { Detail, Span, editing } from "../parts";

export default function DegreeView({ degree }: { degree: Degree }) {
  const edit = editing("education", degree);

  return (
    <>
      <Back href={educationHref}>Education</Back>

      <Detail
        head={edit("degree", { placeholder: "Name this degree" })}
        tools={
          <RemoveMenu table="education" rowid={degree.rowid} name={degree.degree} noun="degree" then={educationHref} />
        }
      >
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="w-64 text-sm">{edit("institution", { placeholder: "Institution" })}</div>
          <Span table="education" row={degree} />
        </div>
      </Detail>
    </>
  );
}
