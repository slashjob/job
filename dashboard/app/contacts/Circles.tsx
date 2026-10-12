"use client";

import Link from "next/link";
import Actions from "@/components/Actions";
import { Command, useForget } from "@/components/act";
import { useDock } from "@/components/Dock";
import { OptionsButton, deleteOption } from "@/components/Options";
import { Group, Invite, Out, Page, Section } from "@/components/ui";
import { describes } from "@/lib/actions";
import { type Lead, companyAnchor, jobHref } from "@/lib/links";
import type { Circle, Contact } from "@/lib/queries";

const reached = (person: Contact) =>
  [person.degree, person.introducer && `via ${person.introducer}`, person.shared_group, person.shared_school]
    .filter(Boolean)
    .join(" · ");

const purpose = (person: Contact, { roles, articles }: Circle) => {
  if (roles.length > 0) return `${person.url} ask for a referral${roles.length === 1 ? ` to ${roles[0].key}` : ""}`;
  if (articles.length > 0) return `${person.url} about ${articles[0].url}`;
  return `${person.url} `;
};

function Person({ person, circle }: { person: Contact; circle: Circle }) {
  const { draft } = useDock();
  const drop = useForget();
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-x-3 sm:flex-row sm:items-center">
        <span className="min-w-0 truncate font-medium sm:shrink-0">
          <Out href={person.url}>{person.name}</Out>
        </span>
        <span title={person.title ?? undefined} className="min-w-0 flex-1 truncate text-sm text-soft">
          {person.title}
        </span>
        <span title={reached(person)} className="min-w-0 truncate text-xs text-soft sm:max-w-72">
          {reached(person)}
        </span>
      </div>
      <OptionsButton
        what={person.name}
        options={[
          {
            key: "message",
            label: <Command id="message" />,
            onPick: () => draft("message", purpose(person, circle)),
          },
          deleteOption("Delete contact", () => drop(person.company, person.url)),
        ]}
      />
    </div>
  );
}

export default function Circles({ circles }: { circles: Circle[] }) {
  if (circles.length === 0)
    return (
      <Invite heading="No contacts yet" detail={describes("network")}>
        <Actions ids={["network"]} />
      </Invite>
    );
  const jobs = circles.filter((circle) => circle.roles.length > 0).map((circle) => ({ ...circle, articles: [] }));
  const news = circles.filter((circle) => circle.articles.length > 0).map((circle) => ({ ...circle, roles: [] }));
  return (
    <Page>
      <Part lead="jobs" heading="Jobs" circles={jobs} />
      <Part lead="news" heading="News" circles={news} />
    </Page>
  );
}

const people = (circles: Circle[]) => circles.reduce((sum, circle) => sum + circle.people.length, 0);

function Part({ lead, heading, circles }: { lead?: Lead; heading: string; circles: Circle[] }) {
  if (circles.length === 0) return null;
  return (
    <Section heading={heading} count={people(circles)}>
      {circles.map((circle) => (
        <Company key={circle.company} id={lead && companyAnchor(lead, circle.company)} circle={circle} />
      ))}
    </Section>
  );
}

const Company = ({ id, circle }: { id?: string; circle: Circle }) => (
  <Group
    id={id}
    heading={circle.company}
    count={circle.people.length}
    items="rows"
    sub={
      (circle.roles.length > 0 || circle.articles.length > 0) && (
        <span className="flex flex-wrap gap-x-4">
          {circle.roles.map((role) => (
            <Link key={role.key} href={jobHref(role.key)} className="hover:text-base-content">
              {role.title}
            </Link>
          ))}
          {circle.articles.map((article) => (
            <Out key={article.article_id} href={article.url}>
              {article.title}
            </Out>
          ))}
        </span>
      )
    }
  >
    {circle.people.map((person) => (
      <Person key={person.url} person={person} circle={circle} />
    ))}
  </Group>
);
