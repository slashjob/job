"use client";

import Link from "next/link";
import { useState } from "react";
import { Newspaper, Pause, Play, Users } from "lucide-react";
import Actions from "@/components/Actions";
import { Command, useDropTopic, usePass, usePause } from "@/components/act";
import { useDock } from "@/components/Dock";
import Field from "@/components/edit/Field";
import type { Column } from "@/components/edit/columns";
import Glyph from "@/components/Glyph";
import { DeleteMenu, OptionsButton, deleteOption } from "@/components/Options";
import { Card, Group, Invite, Out, Page, Stamp } from "@/components/ui";
import { describes } from "@/lib/actions";
import { plural, shortDate } from "@/lib/format";
import { companyHref, projectHref } from "@/lib/links";
import type { Story, Topic } from "@/lib/queries";

const QUERY: Column = {
  name: "query",
  label: "search terms",
  kind: "area",
  rows: 1,
  required: true,
  maxLength: 100,
  className: "-my-1 -ml-1.5 block font-mono text-xs text-soft focus:text-base-content",
};

function Delete({ story }: { story: Story }) {
  const passOn = usePass();
  return <DeleteMenu what={story.title} label="Delete article" onPick={() => passOn(story.article_id)} />;
}

const Known = ({ story }: { story: Story }) =>
  story.contacts ? (
    <Link
      href={companyHref("news", story.company)}
      aria-label={`${plural(story.contacts, "contact")} at ${story.company}`}
      title={`${plural(story.contacts, "contact")} at ${story.company}`}
      className="tnum inline-flex items-center gap-1.5 text-xs text-soft transition-colors hover:text-base-content"
    >
      <Glyph icon={Users} />
      {plural(story.contacts, "contact")}
    </Link>
  ) : null;

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
  <p className="mt-3 flex items-center gap-4 text-sm text-soft">
    <Out href={story.url}>Read article</Out>
    {story.source && <span>{story.source}</span>}
    <Stamp>{shortDate(story.published)}</Stamp>
  </p>
);

const Lead = ({ story }: { story: Story }) => (
  <Card soft>
    <div className="flex gap-4">
      <Photo story={story} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4">
          <h3 className="min-w-0 flex-1 truncate font-display font-medium">{story.company}</h3>
          <Known story={story} />
          <Actions ids={story.contacts ? [] : ["network"]} argument={story.company} />
          <Delete story={story} />
        </div>
        {story.reason && <p className="mt-1.5 leading-relaxed">{story.reason}</p>}
        <Source story={story} />
      </div>
    </div>
  </Card>
);

function TopicMenu({ topic }: { topic: Topic }) {
  const { draft } = useDock();
  const drop = useDropTopic();
  const pause = usePause();
  return (
    <OptionsButton
      what={topic.name}
      options={[
        {
          key: "news",
          label: <Command id="news" />,
          onPick: () => draft("news", topic.name),
        },
        {
          key: "pause",
          label: topic.paused ? "Resume search" : "Pause search",
          icon: <Glyph icon={topic.paused ? Play : Pause} size="sm" />,
          onPick: () => pause(topic.project_id, !topic.paused),
        },
        deleteOption("Delete", () => drop(topic.project_id)),
      ]}
    />
  );
}

const Paused = () => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-selector bg-base-200 px-1.5 py-0.5 font-sans text-xs font-medium text-soft">
    <Glyph icon={Pause} size="sm" />
    Paused
  </span>
);

const Name = ({ topic }: { topic: Topic }) => (
  <>
    <Link
      href={projectHref(topic.employer_id, topic.project_id)}
      title={topic.name}
      className={`min-w-0 truncate decoration-base-300 underline-offset-4 hover:underline
        ${topic.paused ? "text-soft" : ""}`}
    >
      {topic.name}
    </Link>
    {topic.paused ? <Paused /> : null}
  </>
);

const Query = ({ topic }: { topic: Topic }) => (
  <div className={topic.paused ? "opacity-60 focus-within:opacity-100" : ""}>
    <Field table="news_topics" rowid={topic.project_id} column={QUERY} value={topic.query} />
  </div>
);

const Quiet = ({ topic }: { topic: Topic }) => (
  <div className="px-3 py-2.5">
    <div className="flex items-center gap-2 font-medium">
      <Name topic={topic} />
      <span className="ml-auto shrink-0 font-normal">
        <TopicMenu topic={topic} />
      </span>
    </div>
    <Query topic={topic} />
  </div>
);

function Experience({ topic, stories }: { topic: Topic; stories: Story[] }) {
  return (
    <Group
      heading={<Name topic={topic} />}
      count={stories.length}
      tools={<TopicMenu topic={topic} />}
      sub={<Query topic={topic} />}
      items="cards"
    >
      {stories.map((story) => (
        <Lead key={story.article_id} story={story} />
      ))}
    </Group>
  );
}

const newest = (stories: Story[]) =>
  stories.reduce((top, story) => ((story.published ?? "") > top ? (story.published ?? "") : top), "");

export default function Stories({ topics, stories }: { topics: Topic[]; stories: Story[] }) {
  if (topics.length === 0)
    return (
      <Invite heading="No news yet" detail={describes("news")}>
        <Actions ids={["news"]} />
      </Invite>
    );

  const grouped = topics.map((topic) => ({
    topic,
    stories: stories.filter((story) => story.project_id === topic.project_id),
  }));
  const found = grouped
    .filter((group) => group.stories.length > 0)
    .sort(
      (left, right) =>
        left.topic.paused - right.topic.paused || newest(right.stories).localeCompare(newest(left.stories)),
    );
  const quiet = grouped
    .filter((group) => group.stories.length === 0)
    .sort((left, right) => left.topic.paused - right.topic.paused);

  return (
    <Page
      toolbar={
        <>
          <span className="flex items-center text-sm text-soft">{describes("news")}</span>
          <Actions ids={["news"]} />
        </>
      }
    >
      {found.map(({ topic, stories }) => (
        <Experience key={topic.project_id} topic={topic} stories={stories} />
      ))}

      {quiet.length > 0 && (
        <Group heading="No news yet" count={quiet.length} items="rows">
          {quiet.map(({ topic }) => (
            <Quiet key={topic.project_id} topic={topic} />
          ))}
        </Group>
      )}
    </Page>
  );
}
