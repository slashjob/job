"use client";

import { useDock } from "@/components/Dock";
import type { Contact } from "@/lib/queries";

export default function Ways({ person, company }: { person: Contact; company: string }) {
  const { draft } = useDock();
  const ways = [
    { by: "email", shown: person.email },
    { by: "X", shown: person.x && "X" },
    { by: "LinkedIn", shown: person.linkedin && "LinkedIn" },
  ].filter((way) => way.shown);

  return (
    <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm">
      {ways.map(({ by, shown }) => (
        <button key={by} type="button" className="link" onClick={() => draft("contact", `${person.name} at ${company} by ${by}`)}>
          {shown}
        </button>
      ))}
    </p>
  );
}
