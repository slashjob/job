import ProjectView from "../../ProjectView";
import { projectAt } from "../../../found";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: PageProps<"/profile/career/[employer]/[project]">) {
  const { employer, project } = await params;
  return <ProjectView {...projectAt(employer, project)} />;
}
