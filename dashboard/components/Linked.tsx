"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { Card } from "@/components/ui";

const INTERACTIVE = "a, button, input, select, textarea, label, [role=menu]";

export default function Linked({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  const follow = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    if (!window.getSelection()?.isCollapsed) return;
    router.push(href);
  };

  return (
    <article onClick={follow} className={`group cursor-pointer ${className}`}>
      {children}
    </article>
  );
}

export const TitleLink = ({ href, children }: { href: string; children: string | null }) => (
  <Link
    href={href}
    title={children ?? undefined}
    className="decoration-base-300 underline-offset-4 group-hover:underline"
  >
    {children}
  </Link>
);

export function LinkCard({
  href,
  title,
  subtitle,
  framed,
  meta,
  tools,
  children,
}: {
  href: string;
  title: string | null;
  subtitle?: ReactNode;
  framed?: boolean;
  meta?: ReactNode;
  tools: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card soft={!framed}>
      <Linked href={href}>
        <h3 className="line-clamp-2 font-display text-lg font-medium leading-snug sm:line-clamp-1">
          <TitleLink href={href}>{title}</TitleLink>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-sm font-medium text-soft">{subtitle}</p>}

        {children}

        <div className="mt-4 flex items-center gap-5 text-sm text-soft">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">{meta}</div>
          <span className="flex shrink-0 items-center gap-1.5">{tools}</span>
        </div>
      </Linked>
    </Card>
  );
}
