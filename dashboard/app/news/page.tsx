import { news, topics } from "@/lib/queries";
import Stories from "./Stories";

export const dynamic = "force-dynamic";

export default function NewsPage() {
  return <Stories topics={topics()} stories={news()} />;
}
