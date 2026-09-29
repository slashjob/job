import { notFound } from "next/navigation";
import { career, education } from "@/lib/queries";

const byRowid = <T extends { rowid: number }>(rows: T[], id: string) => {
  const row = rows.find((one) => String(one.rowid) === id);
  if (!row) notFound();
  return row;
};

export const employerAt = (id: string) => byRowid(career(), id);

export function projectAt(employerId: string, projectId: string) {
  const employer = employerAt(employerId);
  return { employer, project: byRowid(employer.projects, projectId) };
}

export const degreeAt = (id: string) => byRowid(education(), id);
