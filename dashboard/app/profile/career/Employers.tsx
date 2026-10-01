"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Adder from "@/components/edit/Adder";
import { COLUMNS } from "@/components/edit/columns";
import { LinkCard } from "@/components/Linked";
import { Empty } from "@/components/ui";
import { lengthLabel, monthsBetween, plural, spanLabel, today, when, type When } from "@/lib/format";
import { employerHref } from "@/lib/links";
import type { Employer } from "@/lib/queries";
import { EmployerMenu } from "../parts";

const opened = (employer: Employer) => when(employer.start);

function covering(employers: Employer[], mark: When): When | null {
  let latest: When | null = null;
  for (const employer of employers) {
    const start = opened(employer);
    if (!start || monthsBetween(start, mark) <= 0) continue;
    const ends = when(employer.finish) ?? today();
    if (!latest || monthsBetween(latest, ends) > 0) latest = ends;
  }
  return latest;
}

const GAP_MONTHS = 4;

export default function Employers({ employers }: { employers: Employer[] }) {
  const router = useRouter();

  const ordered = employers.slice().sort((left, right) => {
    const one = opened(left);
    const other = opened(right);
    if (one && other) return monthsBetween(one, other);
    return one ? -1 : other ? 1 : 0;
  });

  return (
    <div className="space-y-3">
      {ordered.length === 0 && <Empty>No employers yet.</Empty>}

      {ordered.map((employer, place) => {
        const start = opened(employer);
        const finish = when(employer.finish);
        const covered = start ? covering(ordered, start) : null;
        const idle = start && covered ? monthsBetween(covered, start) : 0;
        const thin = employer.projects.filter((project) => !project.about).length;

        return (
          <Fragment key={employer.rowid}>
            {idle >= GAP_MONTHS && place > 0 && (
              <p className="tnum pl-5 text-micro text-soft">{lengthLabel(idle)} with no role</p>
            )}
            <LinkCard
              href={employerHref(employer.rowid)}
              title={employer.name}
              subtitle={employer.title}
              meta={
                <>
                  {start && (
                    <span className="tnum">
                      {spanLabel(start, finish, !finish)}, {lengthLabel(monthsBetween(start, finish ?? today()))}
                    </span>
                  )}
                  <span>{plural(employer.projects.length, "project")}</span>
                  {!employer.about && <span className="text-signal">No About</span>}
                  {thin > 0 && <span className="text-signal">{thin} without an About</span>}
                </>
              }
              tools={<EmployerMenu employer={employer} />}
            />
          </Fragment>
        );
      })}

      <Adder
        table="employers"
        columns={[COLUMNS.employers[0]]}
        label="Add an employer"
        onAdded={(rowid) => router.push(employerHref(rowid))}
      />
    </div>
  );
}
