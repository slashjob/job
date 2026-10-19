import { notFound } from "next/navigation";
import Actions from "@/components/Actions";
import Linked from "@/components/Linked";
import { Back, Group, Measure, Out } from "@/components/ui";
import { jobHref } from "@/lib/links";
import { company, type Contact } from "@/lib/queries";
import { JobRow, PassCompany } from "../../jobs";
import Articles from "./Articles";

export const dynamic = "force-dynamic";

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const Person = ({ person }: { person: Contact }) => (
  <div className="px-3 py-2.5">
    <div className="flex flex-wrap items-baseline gap-x-3">
      <h3 className="font-medium">{person.name}</h3>
      {person.title && <span className="text-sm text-soft">{person.title}</span>}
    </div>
    <p className="mt-0.5 text-sm text-soft">{person.why}</p>
    <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm">
      {person.email && <Out href={`mailto:${person.email}`}>{person.email}</Out>}
      {person.x && <Out href={person.x}>X</Out>}
      {person.linkedin && <Out href={person.linkedin}>LinkedIn</Out>}
    </p>
  </div>
);

export default async function CompanyPage({ params }: PageProps<"/jobs/company/[id]">) {
  const { id } = await params;
  const found = company(Number(id));
  if (!found) notFound();

  return (
    <Measure>
      <Back href="/jobs">All jobs</Back>

      <header className="mb-10 mt-2 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-medium leading-tight md:text-3xl">{found.name}</h1>
          {found.website && (
            <p className="mt-1 text-sm">
              <Out href={found.website}>{host(found.website)}</Out>
            </p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          <Actions ids={["contact"]} argument={found.name} />
          <PassCompany company={found} />
        </span>
      </header>

      {found.articles.length > 0 && (
        <Group id="news" heading="News" count={found.articles.length} items="cards">
          <Articles articles={found.articles} />
        </Group>
      )}

      {found.jobs.length > 0 && (
        <Group id="openings" heading="Openings" count={found.jobs.length} items="rows">
          {found.jobs.map((job) => (
            <Linked
              key={job.key}
              href={jobHref(job.key)}
              className="rounded-field px-3 py-2.5 transition-colors hover:bg-base-200"
            >
              <JobRow job={job} />
            </Linked>
          ))}
        </Group>
      )}

      {found.people.length > 0 && (
        <Group id="contacts" heading="Contacts" count={found.people.length} items="rows">
          {found.people.map((person) => (
            <Person key={person.id} person={person} />
          ))}
        </Group>
      )}
    </Measure>
  );
}
