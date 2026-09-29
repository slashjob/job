"use client";

import { useRouter } from "next/navigation";
import Adder from "@/components/edit/Adder";
import RemoveMenu from "@/components/edit/RemoveMenu";
import { COLUMNS } from "@/components/edit/columns";
import { LinkCard } from "@/components/Linked";
import { Empty } from "@/components/ui";
import { spanLabel, when } from "@/lib/format";
import { degreeHref } from "@/lib/links";
import type { Degree } from "@/lib/queries";

export default function Degrees({ degrees }: { degrees: Degree[] }) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {degrees.length === 0 && <Empty>No degrees yet.</Empty>}

      {degrees.map((degree) => {
        const dates = spanLabel(when(degree.start), when(degree.finished), false);
        return (
          <LinkCard
            key={degree.rowid}
            href={degreeHref(degree.rowid)}
            title={degree.degree}
            subtitle={degree.institution}
            meta={dates && <span className="tnum">{dates}</span>}
            tools={<RemoveMenu table="education" rowid={degree.rowid} name={degree.degree} noun="degree" />}
          />
        );
      })}

      <Adder
        table="education"
        columns={[COLUMNS.education[0]]}
        label="Add a degree"
        onAdded={(rowid) => router.push(degreeHref(rowid))}
      />
    </div>
  );
}
