"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as Clicked,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button, Ghost } from "@/components/ui";

const GAP = 4;
const WIDTHS = { narrow: 200, wide: 360 };

type Corner = { top: number; bottom: number; left: number };

function useAnchored(wide?: boolean) {
  const width = WIDTHS[wide ? "wide" : "narrow"];
  const anchor = useRef<HTMLButtonElement>(null);
  const [from, setFrom] = useState<Corner | null>(null);

  const close = useCallback(() => setFrom(null), []);

  const toggle = useCallback(
    (event: Clicked<HTMLButtonElement>) => {
      event.stopPropagation();
      const held = event.currentTarget.getBoundingClientRect();
      setFrom((open) => (open ? null : { top: held.top, bottom: held.bottom, left: held.right - width }));
    },
    [width],
  );

  return { anchor, from, toggle, close };
}

function Flyout({
  from,
  keep,
  wide,
  onClose,
  children,
}: {
  from: Corner;
  wide?: boolean;
  keep?: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const width = WIDTHS[wide ? "wide" : "narrow"];
  const sheet = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const tall = sheet.current?.offsetHeight ?? 0;
    const under = from.bottom + GAP;
    setAt({
      top: under + tall > window.innerHeight - GAP ? Math.max(GAP, from.top - GAP - tall) : under,
      left: Math.min(Math.max(GAP, from.left), window.innerWidth - width - GAP),
    });
  }, [from, width]);

  useEffect(() => {
    const away = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!keep?.current?.contains(target) && !sheet.current?.contains(target)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const moved = (event: Event) => {
      if (!sheet.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    document.addEventListener("scroll", moved, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
      document.removeEventListener("scroll", moved, true);
      window.removeEventListener("resize", onClose);
    };
  }, [keep, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={sheet}
      role="menu"
      onClick={(event) => {
        if ((event.target as Element).closest("[role^=menuitem]")) onClose();
      }}
      style={{
        top: at?.top ?? 0,
        left: at?.left ?? 0,
        width: Math.min(width, window.innerWidth - 2 * GAP),
        visibility: at ? "visible" : "hidden",
      }}
      className="fixed z-50 overflow-hidden rounded-box bg-base-100 p-1 ring-1 ring-base-300/60"
    >
      {children}
    </div>,
    document.body,
  );
}

export function MenuButton({
  trigger,
  legend,
  quiet,
  wide,
  children,
}: {
  trigger: ReactNode;
  legend: string;
  quiet?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const { anchor, from, toggle, close } = useAnchored(wide);
  const opens = {
    ref: anchor,
    onClick: toggle,
    on: Boolean(from),
    "aria-haspopup": "menu" as const,
    "aria-expanded": Boolean(from),
    "aria-label": legend,
    children: trigger,
  };

  return (
    <>
      {quiet ? <Ghost {...opens} /> : <Button roomy {...opens} />}

      {from && (
        <Flyout from={from} keep={anchor} wide={wide} onClose={close}>
          {children}
        </Flyout>
      )}
    </>
  );
}
