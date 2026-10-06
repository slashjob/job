"use client";

import Link from "next/link";
import { useState } from "react";
import { ListFilter } from "lucide-react";
import Actions from "@/components/Actions";
import { Command, useForget } from "@/components/act";
import { useDock } from "@/components/Dock";
import { MenuButton } from "@/components/Flyout";
import { OptionsButton, deleteOption } from "@/components/Options";
import Glyph from "@/components/Glyph";
import { Card, Count, Dot, Empty, Heading, Invite, Measure, Out, Row } from "@/components/ui";
import { describes } from "@/lib/actions";
import { jobHref } from "@/lib/links";
import type { Circle, Contact } from "@/lib/queries";

const DEGREES = ["1st", "2nd"].map((degree) => ({
  name: degree,
  holds: (person: Contact) => person.degree === degree,
}));

const SHARED = [
  { name: "School", holds: (person: Contact) => Boolean(person.shared_school) },
  { name: "Group", holds: (person: Contact) => Boolean(person.shared_group) },
];

const FACETS = [
  { title: "Connection", traits: DEGREES },
  { title: "Shared", traits: SHARED },
];

const reached = (person: Contact) =>
  [person.degree, person.introducer && `via ${person.introducer}`, person.shared_group, person.shared_school]
    .filter(Boolean)
    .join(" · ");

const named = (person: Contact, roles: Circle["roles"]) =>
  roles.length === 1 ? `${person.url} ${roles[0].key}` : person.url;

function Person({ person, roles }: { person: Contact; roles: Circle["roles"] }) {
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
          ...(roles.length > 0
            ? [
                {
                  key: "contact",
                  label: <Command id="contact" />,
                  onPick: () => draft("contact", named(person, roles)),
                },
              ]
            : []),
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
  return <Filtered circles={circles} />;
}

function Filtered({ circles }: { circles: Circle[] }) {
  const [picked, setPicked] = useState<string[]>([]);

  const everyone = circles.flatMap((circle) => circle.people);
  const facets = FACETS.map((facet) => ({
    ...facet,
    traits: facet.traits.filter((trait) => everyone.some(trait.holds)),
  })).filter((facet) => facet.traits.length > 0);

  const degrees = DEGREES.filter((degree) => picked.includes(degree.name));
  const shared = SHARED.filter((trait) => picked.includes(trait.name));

  const matches = (person: Contact) =>
    (!degrees.length || degrees.some((degree) => degree.holds(person))) && shared.every((trait) => trait.holds(person));

  const found = circles
    .map((circle) => ({ ...circle, people: circle.people.filter(matches) }))
    .filter((circle) => circle.people.length > 0);

  return (
    <Measure>
      <div className="-ml-1.5 mb-10 flex items-center justify-between gap-2">
        <MenuButton
          quiet
          leading
          legend="Filter contacts"
          trigger={
            <>
              <Glyph icon={ListFilter} />
              <span className="text-sm">Filter</span>
              {picked.length > 0 && <Count of={picked.length} />}
            </>
          }
        >
          {facets.map((facet) => (
            <div key={facet.title} className="pb-1 last:pb-0">
              <h2 className="eyebrow px-3 pb-1 pt-1">{facet.title}</h2>
              {facet.traits.map(({ name }) => {
                const on = picked.includes(name);
                return (
                  <Row
                    key={name}
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPicked((names) => (on ? names.filter((held) => held !== name) : [...names, name]));
                    }}
                    className={`flex items-center gap-2 ${on ? "font-medium text-base-content" : "text-soft"}`}
                  >
                    <Dot tone={on ? "signal" : "none"} />
                    {name}
                  </Row>
                );
              })}
            </div>
          ))}
        </MenuButton>
        <Actions ids={["network"]} />
      </div>

      {found.length === 0 && <Empty>No contacts match that filter.</Empty>}

      {found.map((circle) => (
        <section key={circle.company} id={circle.company} className="mb-12 scroll-mt-[calc(var(--nav)+1rem)] last:mb-0">
          <Heading className={circle.roles.length ? "mb-1" : ""}>
            {circle.company}
            <Count of={circle.people.length} />
          </Heading>

          {circle.roles.length > 0 && (
            <p className="mb-3 flex flex-wrap gap-x-4 text-sm text-soft">
              {circle.roles.map((role) => (
                <Link key={role.key} href={jobHref(role.key)} className="hover:text-base-content">
                  {role.title}
                </Link>
              ))}
            </p>
          )}

          <Card soft tight>
            {circle.people.map((person) => (
              <Person key={person.url} person={person} roles={circle.roles} />
            ))}
          </Card>
        </section>
      ))}
    </Measure>
  );
}
