import EmployerView from "../EmployerView";
import { employerAt } from "../../found";

export const dynamic = "force-dynamic";

export default async function EmployerPage({ params }: PageProps<"/profile/career/[employer]">) {
  const { employer } = await params;
  return <EmployerView employer={employerAt(employer)} />;
}
