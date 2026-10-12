import { contacts } from "@/lib/queries";
import Circles from "./Circles";

export const dynamic = "force-dynamic";

export default function ContactsPage() {
  return <Circles circles={contacts()} />;
}
