import { jobs } from "@/lib/queries";
import JobList from "./JobList";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  return <JobList jobs={jobs()} />;
}
