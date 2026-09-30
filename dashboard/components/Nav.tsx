"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, User, type LucideIcon } from "lucide-react";
import { useDeck } from "./Deck";
import Glyph from "./Glyph";
import Store from "./Store";
import ThemeToggle from "./ThemeToggle";
import TurnOff from "./TurnOff";
import { useKey } from "./useKey";
import Usage from "./Usage";
import Wordmark from "./Wordmark";
import { Divider, Ghost, GhostLink, NavGroup } from "@/components/ui";
import type { Model } from "@/lib/queries";
import type { Store as Facts } from "@/lib/store";
import type { Usage as Limits } from "@/lib/usage";

type Item = { href: string; label: string; icon: LucideIcon; key: string };

const SECTIONS: Item[] = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, key: "j" },
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
  useKey(useMemo(() => Object.fromEntries(SECTIONS.map(({ href, key }) => [key, () => router.push(href)])), [router]));
  const { shown, working, waiting, toggle } = useDeck();
  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 bg-base-100">
      <div className="mx-auto flex h-[var(--nav)] max-w-[104rem] items-center gap-1 px-2 sm:gap-4 sm:px-4 md:px-6">
        <Ghost
          onClick={toggle}
          aria-expanded={shown}
          aria-label={waiting ? `Conversations, ${waiting} waiting on you` : "Conversations"}
          icon={<Wordmark size={17} working={working} waiting={waiting} />}
        />

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
    </nav>
  );
}
