"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
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
  const profile = here.startsWith("/profile");
  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 bg-base-100">
      <div className="mx-auto flex h-[var(--nav)] max-w-[104rem] items-center gap-1 px-2 sm:gap-4 sm:px-4 md:px-6">
        <Link href="/jobs" aria-label="Jobs" className="mr-auto rounded-field p-1.5">
          <Wordmark />
        </Link>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-4">
          <NavGroup>
            <li>
              <GhostLink
                href="/profile"
                on={profile}
                aria-label="Profile"
                aria-current={profile ? "page" : undefined}
                icon={<Glyph icon={User} size="lg" />}
              />
            </li>
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
