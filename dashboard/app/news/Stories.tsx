"use client";

import Link from "next/link";
import { Pause, Play, Trash2, Users } from "lucide-react";
import Actions from "@/components/Actions";
import { Command, useDropTopic, usePass, usePause } from "@/components/act";
import { useDock } from "@/components/Dock";
import Field from "@/components/edit/Field";
import type { Column } from "@/components/edit/columns";
import Glyph from "@/components/Glyph";
import { OptionsButton, deleteOption } from "@/components/Options";
import { Button, Card, Group, Invite, Measure, Out, Stamp } from "@/components/ui";
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
  className: "-my-1 -ml-1.5 block font-mono text-xs text-soft focus:text-base-content",
};

function Delete({ story }: { story: Story }) {
  const passOn = usePass();
  return (
    <Button tone="grave" icon={<Glyph icon={Trash2} size="sm" />} onClick={() => passOn(story.article_id)}>
      Delete
    </Button>
  );
}

const Known = ({ story }: { story: Story }) =>
  story.contacts ? (
    <Link
      href={companyHref(story.company)}
      className="tnum inline-flex items-center gap-1.5 text-xs text-soft transition-colors hover:text-base-content"
    >
      <Glyph icon={Users} />
      {plural(story.contacts, "contact")}
    </Link>
  ) : null;

const Lead = ({ story }: { story: Story }) => (
  <article className="py-3 first:pt-0 last:pb-0">
    <h3 className="truncate font-display font-medium">{story.company}</h3>
    <p className="mt-0.5 line-clamp-2 text-sm">
      <Out href={story.url}>{story.title}</Out>
    </p>
    {story.reason && <p className="mt-2 leading-relaxed">{story.reason}</p>}
    <div className="mt-3 flex items-center gap-5 text-sm text-soft">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
        <Known story={story} />
        {story.source && <span>{story.source}</span>}
        <Stamp>{shortDate(story.published)}</Stamp>
      </div>
      <span className="flex shrink-0 items-center gap-1.5">
        <Actions ids={story.contacts ? [] : ["network"]} argument={story.company} />
        <Delete story={story} />
      </span>
    </div>
  </article>
);

const Messaged = ({ story }: { story: Story }) => (
  <div className="flex items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
    <span className="min-w-0 shrink-0 truncate font-medium sm:max-w-48">{story.company}</span>
    <span title={story.title} className="hidden min-w-0 flex-1 truncate text-soft sm:block">
      <Out href={story.url}>{story.title}</Out>
    </span>
    <span className="ml-auto flex shrink-0 items-center gap-2">
      <Known story={story} />
      <Stamp>{shortDate(story.published)}</Stamp>
      <Delete story={story} />
    </span>
  </div>
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

const Name = ({ topic }: { topic: Topic }) => (
  <Link
    href={projectHref(topic.employer_id, topic.project_id)}
    title={topic.name}
    className={`min-w-0 truncate decoration-base-300 underline-offset-4 hover:underline
      ${topic.paused ? "text-soft" : ""}`}
  >
    {topic.name}
  </Link>
);

const Query = ({ topic }: { topic: Topic }) => (
  <Field table="news_topics" rowid={topic.project_id} column={QUERY} value={topic.query} />
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
  const fresh = stories.filter((story) => story.status === "lead");
  const messaged = stories.filter((story) => story.status === "messaged");
  return (
    <Group
      heading={<Name topic={topic} />}
      count={fresh.length || undefined}
      tools={<TopicMenu topic={topic} />}
      sub={<Query topic={topic} />}
    >
      <Card soft>
        <div className="divide-y divide-base-200">
          {fresh.map((story) => (
            <Lead key={story.article_id} story={story} />
          ))}
          {messaged.length > 0 && (
            <div className="py-3 first:pt-0 last:pb-0">
              {messaged.map((story) => (
                <Messaged key={story.article_id} story={story} />
              ))}
            </div>
          )}
        </div>
      </Card>
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
    <Measure>
      <div className="mb-10 flex justify-end">
        <Actions ids={["news"]} />
      </div>

      {found.map(({ topic, stories }) => (
        <Experience key={topic.project_id} topic={topic} stories={stories} />
      ))}

      {quiet.length > 0 && (
        <Group heading="No news yet" count={quiet.length}>
          <Card soft tight>
            <div className="divide-y divide-base-200">
              {quiet.map(({ topic }) => (
                <Quiet key={topic.project_id} topic={topic} />
              ))}
            </div>
          </Card>
        </Group>
      )}
    </Measure>
  );
}
