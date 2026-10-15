import { news } from "@/lib/queries";
import Stories from "./Stories";

export const dynamic = "force-dynamic";

export default function NewsPage() {
  return <Stories stories={news()} />;
}
