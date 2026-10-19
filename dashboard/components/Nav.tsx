"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, User } from "lucide-react";
import Glyph from "./Glyph";
import Store from "./Store";
import ThemeToggle from "./ThemeToggle";
import { useKey } from "./useKey";
import Usage from "./Usage";
import { GhostLink, NavDivider, NavGroup, Tip } from "@/components/ui";
import type { Model } from "@/lib/queries";
import type { Store as Facts } from "@/lib/store";
import type { Usage as Limits } from "@/lib/usage";

const KEYS: Record<string, string> = { j: "/jobs", p: "/profile" };

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
  useKey(
    useMemo(
      () => Object.fromEntries(Object.entries(KEYS).map(([key, href]) => [key, () => router.push(href)])),
      [router],
    ),
  );
  const jobs = here.startsWith("/jobs");
  const profile = here.startsWith("/profile");
  return (
    <nav aria-label="Sections" className="group/nav sticky top-0 z-40 pointer-fine:fixed pointer-fine:inset-x-0">
      <div
        className="border-b border-base-300 bg-base-100 transition-transform duration-200 ease-out
          pointer-fine:-translate-y-full pointer-fine:delay-300
          pointer-fine:group-hover/nav:translate-y-0 pointer-fine:group-hover/nav:delay-0
          pointer-fine:group-has-focus-visible/nav:translate-y-0 pointer-fine:group-has-focus-visible/nav:delay-0
          pointer-fine:group-has-aria-expanded/nav:translate-y-0 pointer-fine:group-has-aria-expanded/nav:delay-0"
      >
        <div className="mx-auto flex h-[var(--nav)] max-w-[104rem] items-center justify-center px-2 sm:px-4 md:px-6">
          <NavGroup>
            <li>
              <Tip centered tip="Jobs">
                <GhostLink
                  href="/jobs"
                  on={jobs}
                  aria-label="Jobs"
                  aria-current={jobs ? "page" : undefined}
                  icon={<Glyph icon={Briefcase} size="lg" />}
                />
              </Tip>
            </li>
            <li>
              <Tip centered tip="Profile">
                <GhostLink
                  href="/profile"
                  on={profile}
                  aria-label="Profile"
                  aria-current={profile ? "page" : undefined}
                  icon={<Glyph icon={User} size="lg" />}
                />
              </Tip>
            </li>
            <NavDivider />
            <li>
              <ThemeToggle />
            </li>
            <li>
              <Tip centered tip="Usage and model">
                <Usage usage={limits} models={models} model={model} />
              </Tip>
            </li>
            <li>
              <Tip centered tip="Database">
                <Store store={store} />
              </Tip>
            </li>
          </NavGroup>
        </div>
      </div>
    </nav>
  );
}
