"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Flag } from "@/components/ui";

export type Tab = { href: string; label: string; missing?: number; icon?: ReactNode };

export default function Tabs({
  items,
  label = "Views",
  trailing,
}: {
  items: Tab[];
  label?: string;
  trailing?: ReactNode;
}) {
  const here = usePathname();
  return (
    <nav aria-label={label} className="mb-6 flex items-center gap-2">
      <div className="strip -ml-4 flex min-w-0 flex-1 items-center gap-1 pl-4 sm:ml-0 sm:pl-0">
        {items.map(({ href, label: text, missing = 0, icon }) => {
          const active = here === href || here.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`hit flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-field px-3 py-1.5
              text-sm transition-colors ${
                active
                  ? "bg-base-100 font-medium text-base-content"
                  : "text-soft hover:bg-base-100/60 hover:text-base-content"
              }`}
            >
              {icon}
              {text}
              {missing > 0 && (
                <Flag>
                  {missing}
                  <span className="sr-only"> unanswered</span>
                </Flag>
              )}
            </Link>
          );
        })}
      </div>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </nav>
  );
}
