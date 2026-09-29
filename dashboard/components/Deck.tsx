"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";

import Glyph from "@/components/Glyph";
import Named from "@/components/Named";
import { DeleteMenu } from "@/components/Options";
import { Conversation, useRun, type Asking } from "@/components/run";
import { Dot, Empty, Flag, Ghost, Row } from "@/components/ui";
import { useKey } from "@/components/useKey";
import { CHAT, asked, commanded } from "@/lib/actions";
import { DONE, WAITING, WORKING } from "@/lib/standing";
import type { Model } from "@/lib/queries";
import type { Run } from "@/lib/runs";

const WATCH = 4000;
const KEPT = "deck";

const unchanging = () => () => {};

function Clock({ at }: { at: string }) {
  const local = useSyncExternalStore(
    unchanging,
    () => true,
    () => false,
  );
  return (
    <time dateTime={at}>
      {local &&
        new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

type Deck = {
  shown: boolean;
  working: boolean;
  waiting: number;
  toggle: () => void;
  draft: (action: string, argument?: string) => void;
};

const DeckContext = createContext<Deck | null>(null);

export const useDeck = () => {
  const held = useContext(DeckContext);
  if (!held) throw new Error("useDeck outside Deck");
  return held;
};

function Standing({ standing }: { standing: string }) {
  if (standing === DONE) return null;

  if (standing === WAITING) return <Flag>{standing}</Flag>;

  return (
    <span className={`flex items-center gap-1.5 ${standing === WORKING ? "font-medium text-signal" : "text-soft"}`}>
      {standing === WORKING && <Dot tone="current" blink />}
      {standing}
    </span>
  );
}

export default function Deck({
  runs,
  models,
  model,
  nav,
  children,
}: {
  runs: Run[];
  models: Model[];
  model: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const scrim = useRef<HTMLButtonElement>(null);
  const { lines, run, working, open, start, reply, detach, stop, erase } = useRun();
  const [shown, setShown] = useState(false);
  const [reading, setReading] = useState(false);
  const [said, setSaid] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const busy = runs.some((held) => held.standing === WORKING);
  const waiting = runs.filter((held) => held.standing === WAITING).length;
  const here = runs.find((held) => held.id === run);
  const talking = picked ?? here?.model ?? model;

  useEffect(() => {
    setShown(localStorage.getItem(KEPT) === "open");
  }, []);

  const toggle = useCallback(
    () =>
      setShown((was) => {
        localStorage.setItem(KEPT, was ? "shut" : "open");
        return !was;
      }),
    [],
  );

  useEffect(() => {
    if (!scrim.current?.getClientRects().length) return;
    localStorage.setItem(KEPT, "shut");
    setShown(false);
  }, [path]);

  useEffect(() => {
    const tag = document.querySelector("title");
    if (!tag) return;
    const apply = () => {
      const bare = (tag.textContent ?? "").replace(/^\(\d+\)\s/, "");
      const want = waiting ? `(${waiting}) ${bare}` : bare;
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

  const leave = useCallback(() => {
    input.current?.blur();
    setReading(false);
  }, []);

  const fresh = useCallback(
    (words?: string) => {
      flushSync(() => {
        setReading(true);
        setPicked(null);
        if (words !== undefined) setSaid(words);
        detach();
      });
      input.current?.focus({ preventScroll: true });
    },
    [detach],
  );

  useKey(
    useMemo(
      () => ({
        "/": toggle,
        ...(shown && { n: () => fresh() }),
        ...(shown && reading && !said && { arrowleft: leave }),
      }),
      [toggle, shown, reading, said, fresh, leave],
    ),
  );

  const draft = useCallback(
    (id: string, argument = "") => {
      setShown(true);
      localStorage.setItem(KEPT, "open");
      fresh(`${asked(id, argument)} `);
    },
    [fresh],
  );

  const enter = useCallback(
    (id: string) => {
      setReading(true);
      setPicked(null);
      open(id);
    },
    [open],
  );

  const asking: Asking = {
    asks: CHAT.asks!,
    said,
    onSaid: setSaid,
    input,
    models,
    model: talking,
    onModel: setPicked,
    onLeave: leave,
    onSay: (words) => {
      if (run) return reply(words, talking);
      const command = commanded(words);
      if (command) return start(command.action, command.argument, talking);
      start(CHAT.id, words, talking);
    },
  };

  const title = here?.title ?? "New chat";

  return (
    <DeckContext.Provider value={{ shown, working: busy || working, waiting, toggle, draft }}>
      {nav}
      <div className={`transition-[padding] duration-200 ${shown ? "xl:pl-[calc(var(--deck)+var(--float))]" : ""}`}>
        {children}
      </div>

      {shown && (
        <button
          ref={scrim}
          type="button"
          aria-label="Close conversations"
          onClick={toggle}
          className="fixed inset-x-0 bottom-0 top-[var(--nav)] z-20 bg-base-content/20 xl:hidden"
        />
      )}

      <aside
        aria-label="Conversations"
        aria-hidden={!shown}
        data-sheet={shown ? "open" : "shut"}
        inert={!shown || undefined}
        className={`fixed bottom-[var(--float)] left-[var(--float)] top-[calc(var(--nav)+var(--float))] z-30 flex
          w-[min(var(--deck),calc(100vw-2*var(--float)))] flex-col overflow-hidden rounded-sheet bg-base-100
          shadow-xl shadow-base-content/5 ring-1 ring-base-300/60 transition-transform duration-200
          ${shown ? "translate-x-0" : "-translate-x-[calc(100%+2*var(--float))]"}`}
      >
        <div className="flex h-[var(--nav)] shrink-0 items-center gap-2 px-5 pt-1">
          {reading ? (
            <>
              <Ghost
                onClick={leave}
                className="-ml-2 gap-1 text-mini"
                icon={<Glyph icon={ChevronLeft} />}
              >
                All
              </Ghost>
              <h2 className="min-w-0 flex-1 truncate text-mini font-medium">
                <Named text={title} />
              </h2>
              {here && (
                <span className="shrink-0 text-xs">
                  <Standing standing={here.standing} />
                </span>
              )}
            </>
          ) : (
            <>
              <h2 className="eyebrow flex-1">Conversations</h2>
              <Ghost onClick={() => fresh()} className="-mr-2 text-mini" icon={<Glyph icon={Plus} size="sm" />}>
                New chat
              </Ghost>
            </>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-clip">
          <div
            className={`flex h-full w-[200%] transition-transform duration-200
              ${reading ? "-translate-x-1/2" : ""}`}
          >
            <div className="h-full w-1/2 overflow-auto overscroll-contain" inert={reading || undefined}>
              <div className="flex flex-col gap-1 px-2 pb-2">
                {runs.length === 0 && <Empty>No conversations yet.</Empty>}
                {runs.map((held) => (
                  <div key={held.id} className="relative">
                    <Row
                      roomy
                      onClick={() => enter(held.id)}
                      className={`grid gap-y-1 py-2.5 pr-10
                        ${held.standing === WAITING ? "bg-mark/10 hover:bg-mark/15" : ""}`}
                    >
                      <span className="min-w-0 truncate text-mini">
                        <Named text={held.title} plain />
                      </span>
                      <span className="flex items-center gap-2 text-xs text-soft">
                        <Clock at={held.started} />
                        <Standing standing={held.standing} />
                      </span>
                    </Row>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      <DeleteMenu what={held.title} label="Delete chat" onPick={() => erase(held.id)} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-full w-1/2" inert={!reading || undefined}>
              <Conversation
                className="h-full"
                lines={lines}
                working={working}
                asking={asking}
                onStop={stop}
                empty="Nothing said yet."
              />
            </div>
          </div>
        </div>
      </aside>
    </DeckContext.Provider>
  );
}
