import DegreeView from "../DegreeView";
import { degreeAt } from "../../found";

export const dynamic = "force-dynamic";

export default async function DegreePage({ params }: PageProps<"/profile/education/[degree]">) {
  const { degree } = await params;
  return <DegreeView degree={degreeAt(degree)} />;
}
