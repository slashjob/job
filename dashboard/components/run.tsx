"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, SendHorizontal, Square } from "lucide-react";

import { Command } from "@/components/act";
import { MenuButton } from "@/components/Flyout";
import Glyph from "@/components/Glyph";
import Markdown from "@/components/Markdown";
import Models from "@/components/Models";
import Named, { useLinked } from "@/components/Named";
import { Button, Dot, Empty, Flag, Ghost, Prose, Row, Stamp } from "@/components/ui";
import { asked, suggested, type Action } from "@/lib/actions";
import { WAITING } from "@/lib/standing";
import type { Model } from "@/lib/queries";
import type { Line } from "@/lib/runs";

const parse = (line: string): Line | null => {
  try {
    return JSON.parse(line) as Line;
  } catch {
    return null;
  }
};

async function ask(body: unknown): Promise<Response> {
  const answered = await fetch("/run/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!answered.ok) throw new Error(await answered.text());
  return answered;
}

async function told(body: unknown): Promise<string> {
  const { run } = (await (await ask(body)).json()) as { run: string };
  return run;
}

export function useRun() {
  const router = useRouter();
  const [run, setRun] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [streaming, setStreaming] = useState(false);
  const control = useRef<AbortController | null>(null);

  const open = useCallback(
    async (id: string) => {
      control.current?.abort();
      const watching = new AbortController();
      control.current = watching;

      setRun(id);
      setLines([]);
      setStreaming(true);

      try {
        const answered = await fetch(`/run/stream?run=${id}`, { signal: watching.signal });
        if (!answered.ok || !answered.body) throw new Error(await answered.text());

        const reader = answered.body.getReader();
        const decoder = new TextDecoder();
        let rest = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          rest += decoder.decode(value, { stream: true });
          const parts = rest.split("\n");
          rest = parts.pop() ?? "";
          const fresh = parts.map(parse).filter(Boolean) as Line[];
          if (fresh.length) setLines((standing) => [...standing, ...fresh]);
        }
      } catch (error) {
        if (watching.signal.aborted) return;
        setLines((standing) => [...standing, { kind: "wrong", body: (error as Error).message }]);
      }

      if (watching.signal.aborted) return;
      setStreaming(false);
      router.refresh();
    },
    [router],
  );

  const send = useCallback(
    async (body: unknown) => {
      try {
        const id = await told(body);
        router.refresh();
        return open(id);
      } catch (error) {
        control.current?.abort();
        setRun(null);
        setStreaming(false);
        setLines([{ kind: "wrong", body: (error as Error).message }]);
      }
    },
    [open, router],
  );

  const detach = useCallback(() => {
    control.current?.abort();
    control.current = null;
    setRun(null);
    setStreaming(false);
    setLines([]);
  }, []);

  const forget = useCallback(
    async (id: string, open: boolean) => {
      try {
        await ask({ erase: id });
      } catch (error) {
        return setLines((standing) => [...standing, { kind: "wrong", body: (error as Error).message }]);
      }
      if (open) detach();
      router.refresh();
    },
    [detach, router],
  );

  return {
    lines,
    run,
    working: streaming && lines.at(-1)?.kind !== "end",
    open,
    start: (action: string, argument: string, model: string) => send({ action, argument, model }),
    reply: (words: string, model: string) => send({ run, argument: words, model }),
    detach,
    stop: () => {
      if (run) void told({ stop: run });
    },
    erase: (id?: string) => {
      const held = id ?? run;
      if (held) void forget(held, held === run);
    },
  };
}

type Turn = { asked?: Line; steps: Line[]; reply?: Line; wrong: Line[]; end?: Line };

function turns(lines: Line[]): Turn[] {
  const all: Turn[] = [];
  for (const line of lines) {
    if (line.kind === "asked" || !all.length) all.push({ steps: [], wrong: [] });
    const turn = all[all.length - 1];
    if (line.kind === "asked") turn.asked = line;
    else if (line.kind === "end") turn.end = line;
    else if (line.kind === "wrong") turn.wrong.push(line);
    else turn.steps.push(line);
  }
  return all.map((turn) => {
    const last = turn.steps.findLastIndex((line) => line.kind === "said");
    return last < 0 ? turn : { ...turn, reply: turn.steps[last], steps: turn.steps.filter((_, at) => at !== last) };
  });
}

function Steps({ steps }: { steps: Line[] }) {
  const linked = useLinked();
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 pt-3">
      <Ghost
        tight
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="py-1 text-xs"
        icon={<Glyph icon={ChevronRight} size="sm" className={`transition-transform ${open ? "rotate-90" : ""}`} />}
      >
        {steps.length} {steps.length === 1 ? "step" : "steps"}
      </Ghost>
      {open && (
        <div className="ml-2.5 mt-1 flex flex-col gap-1.5 border-l border-base-300 pl-3">
          {steps.map((step, at) => (
            <Markdown key={at} className="text-soft">
              {linked(step.body)}
            </Markdown>
          ))}
        </div>
      )}
    </div>
  );
}

function Exchange({ turn }: { turn: Turn }) {
  const linked = useLinked();
  const ended = turn.end?.body;

  return (
    <section>
      {turn.asked && (
        <div className="flex justify-end px-4 pt-5">
          <Prose className="max-w-[85%] rounded-sheet rounded-br-md bg-base-200 px-4 py-2.5">
            <Named text={turn.asked.body} />
          </Prose>
        </div>
      )}
      {turn.steps.length > 0 && <Steps steps={turn.steps} />}
      {ended && <div className="px-5 pt-4">{ended === WAITING ? <Flag>{ended}</Flag> : <Stamp>{ended}</Stamp>}</div>}
      {turn.reply && (
        <div className={`px-5 ${ended ? "pt-1.5" : "pt-4"}`}>
          <Markdown>{linked(turn.reply.body)}</Markdown>
        </div>
      )}
      {turn.wrong.map((line, at) => (
        <div key={at} className="px-5 pt-2">
          <Prose className="text-error">
            <Named text={line.body} />
          </Prose>
        </div>
      ))}
    </section>
  );
}

export type Asking = {
  asks: string;
  said: string;
  onSaid: (said: string) => void;
  onSay: (said: string) => void;
  onLeave?: () => void;
  input?: RefObject<HTMLTextAreaElement | null>;
  models: Model[];
  model: string;
  onModel: (key: string) => void;
};

function Picker({ models, model, onPick }: { models: Model[]; model: string; onPick: (key: string) => void }) {
  const label = models.find((choice) => choice.key === model)?.label ?? model;

  return (
    <MenuButton
      quiet
      legend={`Model, ${label}`}
      trigger={
        <>
          <span className="text-xs">{label}</span>
          <Glyph icon={ChevronDown} size="sm" />
        </>
      }
    >
      <Models models={models} model={model} onPick={onPick} />
    </MenuButton>
  );
}

function Menu({
  actions,
  at,
  onHover,
  onPick,
}: {
  actions: Action[];
  at: number;
  onHover: (at: number) => void;
  onPick: (action: Action) => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (box.current?.children[at] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [at, actions]);

  return (
    <div
      ref={box}
      role="listbox"
      aria-label="Actions"
      className="mb-2 flex max-h-64 flex-col gap-0.5 overflow-auto rounded-box bg-base-100 p-1 shadow-lg shadow-base-content/5"
    >
      {actions.map((action, index) => (
        <Row
          key={action.id}
          role="option"
          roomy
          on={index === at}
          aria-selected={index === at}
          onMouseMove={() => onHover(index)}
          onClick={() => onPick(action)}
          className="grid grid-cols-[minmax(0,1fr)] gap-y-0.5"
        >
          <span className="min-w-0 truncate text-sm">
            <Command id={action.id} argument={action.argument} />
          </span>
          <span className="text-xs text-soft">{action.does}</span>
        </Row>
      ))}
    </div>
  );
}

function Composer({
  asks,
  onSay,
  onLeave,
  input,
  said,
  onSaid,
  models,
  model,
  onModel,
  working,
  waiting,
  onStop,
}: Asking & { working?: boolean; waiting?: boolean; onStop?: () => void }) {
  const [at, setAt] = useState(0);
  const [shut, setShut] = useState(false);
  const ready = said.trim().length > 0 && !working;
  const menu = shut ? [] : suggested(said);
  const chosen = menu[Math.min(at, menu.length - 1)];

  useEffect(() => {
    if (waiting) input?.current?.focus({ preventScroll: true });
  }, [waiting, input]);

  const write = (words: string) => {
    setAt(0);
    setShut(false);
    onSaid(words);
  };

  const complete = (action: Action) => {
    setShut(true);
    onSaid(`${asked(action.id, "")} `);
    input?.current?.focus({ preventScroll: true });
  };

  return (
    <form
      className={`m-3 mt-2 rounded-sheet bg-base-200 px-4 pb-2.5 pt-3 ring-1 transition-shadow
        ${waiting ? "ring-mark" : "ring-transparent focus-within:ring-base-300"}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        onSay(said.trim());
        write("");
      }}
    >
      {waiting && (
        <p className="mb-2.5 flex items-center gap-2 text-mini text-soft">
          <Dot tone="mark" />
          Waiting on your answer
        </p>
      )}

      {chosen && <Menu actions={menu} at={menu.indexOf(chosen)} onHover={setAt} onPick={complete} />}

      <textarea
        ref={input}
        rows={1}
        aria-label={asks}
        placeholder={asks}
        className="max-h-40 w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed
          placeholder:text-soft focus:outline-none"
        style={{ fieldSizing: "content" } as React.CSSProperties}
        value={said}
        onChange={(event) => write(event.target.value)}
        onKeyDown={(event) => {
          if (chosen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : menu.length - 1;
            return setAt((menu.indexOf(chosen) + step) % menu.length);
          }
          if (chosen && event.key === "Escape") return setShut(true);
          if (event.key === "Escape") return event.currentTarget.blur();
          if (onLeave && !said && event.key === "ArrowLeft") {
            event.preventDefault();
            return onLeave();
          }
          if (event.key !== "Enter" && event.key !== "Tab") return;
          if (event.shiftKey) return;
          if (!chosen && event.key === "Enter" && matchMedia("(pointer: coarse)").matches) return;
          event.preventDefault();
          if (chosen) return complete(chosen);
          if (event.key === "Enter") event.currentTarget.form?.requestSubmit();
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-xs text-soft pointer-coarse:invisible">Shift + Enter for a new line</p>
        <div className="flex items-center gap-1">
          <Picker models={models} model={model} onPick={onModel} />
          {working ? (
            <Button onClick={onStop} icon={<Glyph icon={Square} size="sm" className="fill-current" />}>
              Stop
            </Button>
          ) : (
            <Button type="submit" tone="firm" disabled={!ready} icon={<Glyph icon={SendHorizontal} size="sm" />}>
              Send
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function span(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function Elapsed() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const since = Date.now();
    const tick = setInterval(() => setSeconds(Math.floor((Date.now() - since) / 1000)), 250);
    return () => clearInterval(tick);
  }, []);

  return <span className="tabular-nums">({span(seconds)})</span>;
}

export function Conversation({
  lines,
  empty,
  working,
  asking,
  onStop,
  className = "",
}: {
  lines: Line[];
  empty: string;
  working?: boolean;
  asking?: Asking | null;
  onStop?: () => void;
  className?: string;
}) {
  const tail = useRef<HTMLDivElement | null>(null);
  const last = lines.at(-1);
  const waiting = !working && last?.kind === "end" && last.body === WAITING;

  useEffect(() => {
    const held = tail.current;
    if (held) held.scrollTop = held.scrollHeight;
  }, [lines, working]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div ref={tail} className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain" aria-live="polite">
        {lines.length === 0 && !working ? (
          <div className="flex flex-1 items-center justify-center">
            <Empty>{empty}</Empty>
          </div>
        ) : (
          <div className="pb-4">
            {turns(lines).map((turn, at) => (
              <Exchange key={at} turn={turn} />
            ))}
            {working && (
              <div className="flex items-center gap-2 px-5 pb-2 pt-4 text-sm text-soft">
                Working
                <Elapsed />
                <span aria-hidden className="flex items-center gap-1">
                  {[0, 200, 400].map((delay) => (
                    <Dot key={delay} tone="mark" blink delay={delay} />
                  ))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {asking && <Composer {...asking} working={working} waiting={waiting} onStop={onStop} />}
    </div>
  );
}
