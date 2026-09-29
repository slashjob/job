"use client";

import Link from "next/link";
import { Fragment, createContext, useContext, useMemo, type ReactNode } from "react";
import { jobHref } from "@/lib/links";

type Names = Record<string, string>;

const NamesContext = createContext<Names>({});

export const NamesProvider = ({ names, children }: { names: Names; children: ReactNode }) => (
  <NamesContext.Provider value={names}>{children}</NamesContext.Provider>
);

const escaped = (key: string) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matcher = (names: Names, ticked: boolean) => {
  const keys = Object.keys(names).sort((one, two) => two.length - one.length);
  if (!keys.length) return null;
  const tick = ticked ? "`?" : "";
  return new RegExp(`${tick}(?<![\\w:/=-])(${keys.map(escaped).join("|")})(?![\\w:-])${tick}`, "g");
};

export function useLinked() {
  const names = useContext(NamesContext);
  return useMemo(() => {
    const found = matcher(names, true);
    return (text: string) =>
      found
        ? text.replace(found, (_, key: string) => `[${names[key].replace(/[[\]\\]/g, "\\$&")}](${jobHref(key)})`)
        : text;
  }, [names]);
}

export default function Named({ text, plain }: { text: string; plain?: boolean }) {
  const names = useContext(NamesContext);
  const found = useMemo(() => matcher(names, false), [names]);
  if (!found) return text;

  return text.split(found).map((part, at) => {
    if (at % 2 === 0) return <Fragment key={at}>{part}</Fragment>;
    if (plain)
      return (
        <span key={at} title={part}>
          {names[part]}
        </span>
      );
    return (
      <Link key={at} href={jobHref(part)} title={part} className="link">
        {names[part]}
      </Link>
    );
  });
}
