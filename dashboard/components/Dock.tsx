"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import Glyph from "@/components/Glyph";
import Named from "@/components/Named";
import Wordmark from "@/components/Wordmark";
import { Conversation, focusEnd, useRun, type Asking } from "@/components/run";
import { Caret, Flag, Ghost, Measure, Row, Stamp, Tip } from "@/components/ui";
import { useKey } from "@/components/useKey";
import { usePing } from "@/components/usePing";
import { CHAT, asked, commanded, unprefixed } from "@/lib/actions";
import { WAITING, WORKING } from "@/lib/standing";
import type { Model } from "@/lib/queries";
import type { Run } from "@/lib/runs";

const WATCH = 4000;

type Dock = {
  working: boolean;
  waiting: boolean;
  draft: (action: string, argument?: string) => void;
};

const HEADING = "grid min-w-0 flex-1 items-baseline gap-x-2.5";
const MARKED = `${HEADING} grid-cols-[auto_minmax(0,max-content)_minmax(0,1fr)_auto]`;
const BARE = `${HEADING} grid-cols-[minmax(0,max-content)_minmax(0,1fr)_auto]`;

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
  const dock = useRef<HTMLDivElement>(null);

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
    focusEnd(input.current);
  }, [opened, detach, unfold]);

  const summon = useCallback(() => {
    flushSync(() => {
      unfold();
      setSaid((standing) => (standing.trim() ? standing : "/"));
    });
    focusEnd(input.current);
  }, [unfold]);

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
      focusEnd(input.current);
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

  const heading = (
    <>
      <span className="truncate text-mini font-medium">
        {chat ? <Named text={opened ? chat.title : unprefixed(chat.title)} plain /> : "New chat"}
      </span>
      <span className="truncate text-xs text-soft">{!opened && chat?.doing && <Named text={chat.doing} plain />}</span>
      {chat ? <Standing standing={chat.standing} /> : <span />}
    </>
  );

  return (
    <DockContext.Provider value={{ working: busy || working, waiting, draft }}>
      {nav}
      {children}

      <aside
        aria-label="Chat"
        data-held={Boolean(chat || opened || said) || undefined}
        className="group/dock sticky bottom-0 z-30 pointer-fine:fixed pointer-fine:inset-x-0"
      >
        <div
          className="relative bg-base-200 px-4 pb-4 transition-transform duration-200 ease-out
            before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-8
            before:bg-linear-to-t before:from-base-200 before:transition-opacity before:duration-200 md:px-6 md:pb-6
            pointer-fine:translate-y-full pointer-fine:delay-300 pointer-fine:before:opacity-0 pointer-fine:before:delay-300
            pointer-fine:group-summoned/dock:translate-y-0 pointer-fine:group-summoned/dock:delay-0
            pointer-fine:group-summoned/dock:before:opacity-100 pointer-fine:group-summoned/dock:before:delay-0"
        >
          <Measure ref={dock} className="relative flex">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-3 bottom-0 rounded-box beacon motion-safe:animate-beacon"
            />
            <div
              className={`relative flex max-h-[min(var(--dock-tall),calc(100dvh-var(--nav)-3rem))] min-w-0 flex-1
                flex-col overflow-hidden rounded-box border bg-base-100
                ${waiting ? "border-mark" : "border-mark/30"}`}
            >
              {chat || opened ? (
                <>
                  <div className={`flex shrink-0 items-center p-1.5 ${opened ? "gap-1" : ""}`}>
                    {opened ? (
                      <div className={`${MARKED} px-3 py-2 text-sm`}>
                        <span className="flex self-center">
                          <Mark standing={chat?.standing} />
                        </span>
                        {heading}
                      </div>
                    ) : (
                      <>
                        <Tip tip="Job actions">
                          <Ghost
                            onClick={summon}
                            onPointerDown={(event) => event.preventDefault()}
                            aria-label={waiting ? "Job actions, waiting on you" : "Job actions"}
                          >
                            <Wordmark size={16} working={busy} waiting={waiting} />
                          </Ghost>
                        </Tip>
                        <Row roomy onClick={unfold} aria-expanded={false} className={`${BARE} pl-1`}>
                          {heading}
                        </Row>
                      </>
                    )}
                    {opened && (
                      <Tip tip="Clear chat">
                        <Ghost tone="grave" onClick={wipe} aria-label="Clear chat" icon={<Glyph icon={X} />} />
                      </Tip>
                    )}
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
            </div>
          </Measure>
        </div>
      </aside>
    </DockContext.Provider>
  );
}
