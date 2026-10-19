
import { Card, Out } from "@/components/ui";
import { shortDate } from "@/lib/format";
import type { Article } from "@/lib/queries";
import { Matches } from "../../jobs";

const Byline = ({ article }: { article: Article }) => (
  <p className="mt-0.5 text-sm text-soft">
    <Out href={article.url}>{article.source ?? "Read article"}</Out>
    {article.published && `, ${shortDate(article.published)}`}
  </p>
);

export default function Articles({ articles }: { articles: Article[] }) {
  return articles.map((article) => (
    <Card key={article.article_id} soft>
      <h3 className="line-clamp-2 font-display font-medium">{article.title}</h3>
      <Byline article={article} />
      {article.reason && <p className="mt-3 leading-relaxed">{article.reason}</p>}
      <Matches articles={[article]} />
    </Card>
  ));
}
