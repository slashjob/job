import { network } from "@/lib/queries";
import Circles from "./Circles";

export const dynamic = "force-dynamic";

export default function NetworkPage() {
  return <Circles circles={network()} />;
}
