"use client";

import Link from "next/link";
import { useState } from "react";
import { Newspaper } from "lucide-react";
import Actions from "@/components/Actions";
import { Command, usePass } from "@/components/act";
import { useDock } from "@/components/Dock";
import Glyph from "@/components/Glyph";
import { DeleteMenu, OptionsButton } from "@/components/Options";
import { Card, Group, Invite, Out, Page, Stamp } from "@/components/ui";
import { describes } from "@/lib/actions";
import { shortDate } from "@/lib/format";
import { projectHref } from "@/lib/links";
import type { Story } from "@/lib/queries";

function Delete({ story }: { story: Story }) {
  const passOn = usePass();
  return <DeleteMenu what={story.title} label="Delete article" onPick={() => passOn(story.article_id)} />;
}

function Photo({ story }: { story: Story }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noreferrer"
      tabIndex={-1}
      aria-hidden
      className="relative grid aspect-[4/3] w-20 shrink-0 place-items-center self-start overflow-hidden rounded-field
        bg-base-200 text-soft sm:w-28 after:absolute after:inset-0 after:rounded-field after:ring-1
        after:ring-base-content/10 after:ring-inset"
    >
      {story.image && !broken ? (
        <img
          src={story.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      ) : (
        <Newspaper size={28} strokeWidth={1.25} />
      )}
    </a>
  );
}

const Source = ({ story }: { story: Story }) => (
  <div className="mt-3 flex items-center gap-4">
    <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-soft">
      <Out href={story.url}>Read article</Out>
      {story.source && <span>{story.source}</span>}
      <Stamp>{shortDate(story.published)}</Stamp>
    </p>
    <span className="flex shrink-0 items-center gap-1.5">
      <Actions ids={["contact"]} argument={story.company} />
      <Delete story={story} />
    </span>
  </div>
);

const Lead = ({ story }: { story: Story }) => (
  <Card soft>
    <div className="flex gap-4">
      <Photo story={story} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display font-medium">{story.company}</h3>
        {story.reason && <p className="mt-1.5 leading-relaxed">{story.reason}</p>}
        <Source story={story} />
      </div>
    </div>
  </Card>
);

type Matched = { project_id: number | null; project: string | null; employer_id: number | null };

function ProjectMenu({ project }: { project: string }) {
  const { draft } = useDock();
  return (
    <OptionsButton
      what={project}
      options={[{ key: "news", label: <Command id="news" />, onPick: () => draft("news", project) }]}
    />
  );
}

const Name = ({ matched }: { matched: Matched }) =>
  matched.project_id !== null && matched.employer_id !== null ? (
    <Link
      href={projectHref(matched.employer_id, matched.project_id)}
      title={matched.project ?? undefined}
      className="min-w-0 truncate decoration-base-300 underline-offset-4 hover:underline"
    >
      {matched.project}
    </Link>
  ) : (
    <span className="text-soft">No project</span>
  );

const Experience = ({ matched, stories }: { matched: Matched; stories: Story[] }) => (
  <Group
    heading={<Name matched={matched} />}
    count={stories.length}
    tools={matched.project ? <ProjectMenu project={matched.project} /> : undefined}
    items="cards"
  >
    {stories.map((story) => (
      <Lead key={story.article_id} story={story} />
    ))}
  </Group>
);

const newest = (stories: Story[]) =>
  stories.reduce((top, story) => ((story.published ?? "") > top ? (story.published ?? "") : top), "");

export default function Stories({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return <Invite heading="No news yet" detail={describes("news")} />;

  const grouped = [...new Set(stories.map((story) => story.project_id))]
    .map((project_id) => {
      const matched = stories.filter((story) => story.project_id === project_id);
      return { matched: matched[0], stories: matched };
    })
    .sort((left, right) => newest(right.stories).localeCompare(newest(left.stories)));

  return (
    <Page>
      {grouped.map(({ matched, stories }) => (
        <Experience key={matched.project_id ?? "none"} matched={matched} stories={stories} />
      ))}
    </Page>
  );
}
