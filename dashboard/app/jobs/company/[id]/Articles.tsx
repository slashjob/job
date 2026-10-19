"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { Card, Out } from "@/components/ui";
import { shortDate } from "@/lib/format";
import type { Article } from "@/lib/queries";
import { Matches } from "../../jobs";

function Photo({ article }: { article: Article }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      tabIndex={-1}
      aria-hidden
      className="relative grid aspect-[4/3] w-20 shrink-0 place-items-center self-start overflow-hidden rounded-field
        bg-base-200 text-soft sm:w-28 after:absolute after:inset-0 after:rounded-field after:ring-1
        after:ring-base-content/10 after:ring-inset"
    >
      {article.image && !broken ? (
        <img
          src={article.image}
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

const Byline = ({ article }: { article: Article }) => (
  <p className="mt-0.5 text-sm text-soft">
    <Out href={article.url}>{article.source ?? "Read article"}</Out>
    {article.published && `, ${shortDate(article.published)}`}
  </p>
);

export default function Articles({ articles }: { articles: Article[] }) {
  return articles.map((article) => (
    <Card key={article.article_id} soft>
      <div className="flex gap-4">
        <Photo article={article} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display font-medium">{article.title}</h3>
          <Byline article={article} />
          {article.reason && <p className="mt-3 leading-relaxed">{article.reason}</p>}
          <Matches articles={[article]} />
        </div>
      </div>
    </Card>
  ));
}
