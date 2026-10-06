"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

import Glyph from "@/components/Glyph";
import Named from "@/components/Named";
import { Conversation, useRun, type Asking } from "@/components/run";
import { Caret, Flag, Ghost, Measure, Row, Stamp, Tip } from "@/components/ui";
import { useKey } from "@/components/useKey";
import { usePing } from "@/components/usePing";
import { CHAT, asked, commanded } from "@/lib/actions";
import { WAITING, WORKING } from "@/lib/standing";
import type { Model } from "@/lib/queries";
import type { Run } from "@/lib/runs";

const WATCH = 4000;

type Dock = {
  working: boolean;
  waiting: boolean;
  draft: (action: string, argument?: string) => void;
};

const DockContext = createContext<Dock | null>(null);

export const useDock = () => {
  const held = useContext(DockContext);
  if (!held) throw new Error("useDock outside Dock");
  return held;
};

const Mark = ({ standing }: { standing?: string }) => (
  <Caret tone={standing === WORKING || standing === WAITING ? "mark" : "rest"} blink={standing === WORKING} />
);

const Standing = ({ standing }: { standing: string }) =>
  standing === WAITING ? <Flag>{standing}</Flag> : <Stamp>{standing}</Stamp>;

export default function Dock({
  run: held,
  models,
  model,
  nav,
  children,
}: {
  run: Run | null;
  models: Model[];
  model: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const { lines, run, working, open, start, reply, detach, stop, clear } = useRun();
  const [said, setSaid] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const dock = useRef<HTMLElement>(null);

  const chat = held && held.id !== gone ? held : null;
  const opened = run !== null;
  const busy = chat?.standing === WORKING;
  const waiting = chat?.standing === WAITING;
  const talking = picked ?? chat?.model ?? model;
  const { sounding, toggleSound } = usePing(chat);

  useEffect(() => {
    const tag = document.querySelector("title");
    if (!tag) return;
    const apply = () => {
      const bare = (tag.textContent ?? "").replace(/^\(\d+\)\s/, "");
      const want = waiting ? `(1) ${bare}` : bare;
      if (tag.textContent !== want) tag.textContent = want;
    };
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(tag, { childList: true, characterData: true, subtree: true });
    return () => watch.disconnect();
  }, [waiting]);

  useEffect(() => {
    if (!busy && !working) return;
    const timer = setInterval(() => router.refresh(), WATCH);
    return () => clearInterval(timer);
  }, [busy, working, router]);

  useEffect(() => {
    if (!opened) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (dock.current?.contains(target) || target.closest("[role=menu]")) return;
      detach();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [opened, detach]);

  const unfold = useCallback(() => {
    if (chat) void open(chat.id);
  }, [chat, open]);

  const toggle = useCallback(() => {
    if (opened) return detach();
    flushSync(unfold);
    input.current?.focus({ preventScroll: true });
  }, [opened, detach, unfold]);

  const wipe = useCallback(() => {
    if (!chat && !run) return;
    setGone(run ?? chat?.id ?? null);
    setSaid("");
    setPicked(null);
    clear();
  }, [chat, run, clear]);

  const draft = useCallback(
    (id: string, argument = "") => {
      flushSync(() => {
        wipe();
        setSaid(`${asked(id, argument)} `);
      });
      input.current?.focus({ preventScroll: true });
    },
    [wipe],
  );

  useKey(
    useMemo(
      () => ({
        "/": toggle,
        ...(opened && { escape: detach }),
      }),
      [toggle, opened, detach],
    ),
  );

  const asking: Asking = {
    asks: CHAT.asks!,
    said,
    onSaid: setSaid,
    input,
    models,
    model: talking,
    onModel: setPicked,
    sounding,
    onSound: toggleSound,
    onSay: (words) => {
      if (run) return reply(words, talking);
      const command = commanded(words);
      if (command) return start(command.action, command.argument, talking);
      start(CHAT.id, words, talking);
    },
  };

  return (
    <DockContext.Provider value={{ working: busy || working, waiting, draft }}>
      {nav}
      {children}

      <aside
        ref={dock}
        aria-label="Chat"
        className="sticky bottom-0 z-30 bg-base-200 px-4 pb-4 before:pointer-events-none before:absolute
          before:inset-x-0 before:bottom-full before:h-8 before:bg-linear-to-t before:from-base-200
          md:px-6 md:pb-6"
      >
        <Measure
          className={`relative flex max-h-[min(var(--dock-tall),calc(100dvh-var(--nav)-3rem))] flex-col overflow-hidden
            rounded-box bg-base-100 shadow-[0_0_2.5rem_-0.75rem_color-mix(in_oklab,var(--color-mark)_45%,transparent)]
            border ${waiting ? "border-mark" : "border-mark/30"}`}
        >
          {chat || opened ? (
            <>
              <div className="flex shrink-0 items-center gap-1 p-1.5">
                <Row
                  roomy
                  onClick={opened ? detach : unfold}
                  aria-expanded={opened}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 gap-y-0.5"
                >
                  <Mark standing={chat?.standing} />
                  <span className="truncate text-mini font-medium">
                    {chat ? <Named text={chat.title} plain /> : "New chat"}
                  </span>
                  {chat ? <Standing standing={chat.standing} /> : <span />}
                  <Glyph icon={ChevronDown} className={`text-soft ${opened ? "" : "rotate-180"}`} />
                  {!opened && chat?.doing && (
                    <span className="col-span-3 col-start-2 truncate text-xs text-soft">
                      <Named text={chat.doing} plain />
                    </span>
                  )}
                </Row>
                <Tip tip="Clear chat">
                  <Ghost onClick={wipe} aria-label="Clear chat" icon={<Glyph icon={X} />} />
                </Tip>
              </div>
              {opened && (
                <Conversation
                  className="min-h-0 flex-1"
                  lines={lines}
                  working={working}
                  asking={asking}
                  onStop={stop}
                />
              )}
            </>
          ) : (
            <Conversation lines={lines} asking={asking} />
          )}
        </Measure>
      </aside>
    </DockContext.Provider>
  );
}
