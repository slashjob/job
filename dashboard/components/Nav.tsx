"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, User, Users, type LucideIcon } from "lucide-react";
import { useDock } from "./Dock";
import Glyph from "./Glyph";
import Store from "./Store";
import ThemeToggle from "./ThemeToggle";
import TurnOff from "./TurnOff";
import { useKey } from "./useKey";
import Usage from "./Usage";
import Wordmark from "./Wordmark";
import { Divider, GhostLink, NavGroup } from "@/components/ui";
import type { Model } from "@/lib/queries";
import type { Store as Facts } from "@/lib/store";
import type { Usage as Limits } from "@/lib/usage";

type Item = { href: string; label: string; icon: LucideIcon; key: string };

const SECTIONS: Item[] = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, key: "j" },
  { href: "/network", label: "Network", icon: Users, key: "n" },
  { href: "/profile", label: "Profile", icon: User, key: "p" },
];

export default function Nav({
  store,
  limits,
  models,
  model,
}: {
  store: Facts;
  limits: Limits | null;
  models: Model[];
  model: string;
}) {
  const here = usePathname();
  const router = useRouter();
  const { working, waiting } = useDock();
  useKey(useMemo(() => Object.fromEntries(SECTIONS.map(({ href, key }) => [key, () => router.push(href)])), [router]));
  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 bg-base-100">
      <div
        className="mx-auto flex h-[var(--nav)] max-w-[104rem] items-center gap-1 px-2 sm:gap-4 sm:px-4
          md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6"
      >
        <NavGroup fill>
          {SECTIONS.map(({ href, label, icon }) => {
            const active = here.startsWith(href);
            return (
              <li key={href}>
                <GhostLink
                  href={href}
                  on={active}
                  aria-current={active ? "page" : undefined}
                  className="whitespace-nowrap text-sm"
                  icon={<Glyph icon={icon} />}
                >
                  <span className="max-sm:sr-only">{label}</span>
                </GhostLink>
              </li>
            );
          })}
        </NavGroup>

        <span
          role="img"
          aria-label={waiting ? "Job, waiting on you" : "Job"}
          className="inline-flex p-1.5 max-md:hidden"
        >
          <Wordmark size={17} working={working} waiting={waiting} />
        </span>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-4">
          <NavGroup>
            <li>
              <ThemeToggle />
            </li>
            <li>
              <Usage usage={limits} models={models} model={model} />
            </li>
            <li>
              <Store store={store} />
            </li>
          </NavGroup>

          <Divider />

          <TurnOff />
        </div>
      </div>
    </nav>
  );
}
