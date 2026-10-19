import { companies } from "@/lib/queries";
import Companies from "./Companies";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  return <Companies companies={companies()} />;
}
