import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { asked, browses, runnable, shown } from "@/lib/actions";
import { BRIEFING } from "@/lib/briefing";
import { heard, outermost, type Line } from "@/lib/claude";
import { CAREER, MAIN, active, installed, script } from "@/lib/skill";
import { CLOSING, DONE, WORKING } from "@/lib/standing";
import { MODELS, model } from "./queries";

export type { Line } from "@/lib/claude";

export type Run = {
  id: string;
  action: string;
  title: string;
  argument: string;
  started: string;
  standing: string;
  model: string | null;
  doing: string;
};

type Modelled = { kind: "model"; key: string };

type Kept =
  | { kind: "opened"; action: string; title: string; started: string; argument?: string; database?: string }
  | { kind: "session"; id: string }
  | Modelled
  | Line;

const LONGEST = 8000;
const GIST = 200;
const RUNS = path.join(CAREER, "runs");
const ID = /^[0-9a-fA-F-]{36}$/;

const file = (id: string) => path.join(RUNS, `${id}.jsonl`);

const spoken = (kept: Kept): kept is Line => kept.kind !== "opened" && kept.kind !== "session" && kept.kind !== "model";

const modelled = (kept: Kept[]) => [...kept].reverse().find((one): one is Modelled => one.kind === "model")?.key;

type Live = { child: ChildProcess; ended: string; hears: Set<(kept: Kept) => void> };

const memory = globalThis as { runs?: Map<string, Live> };
const live = () => (memory.runs ??= new Map<string, Live>());

function append(id: string, kept: Kept) {
  fs.mkdirSync(RUNS, { recursive: true });
  fs.appendFileSync(file(id), `${JSON.stringify(kept)}\n`);
  for (const hears of live().get(id)?.hears ?? []) hears(kept);
}

function held(id: string): Kept[] {
  if (!ID.test(id)) throw new Error("not a run id");
  let text: string;
  try {
    text = fs.readFileSync(file(id), "utf8");
  } catch {
    throw new Error(`no such run: ${id}`);
  }
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Kept);
}

const gist = (kept: Kept[]) => {
  for (const one of [...kept].reverse()) {
    if (one.kind === "asked") return "";
    if (one.kind !== "said" && one.kind !== "wrong") continue;
    const opening = one.body.split("\n").find((line) => line.trim()) ?? "";
    return opening
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*`#>]/g, "")
      .trim()
      .slice(0, GIST);
  }
  return "";
};

const standing = (id: string, kept: Kept[]) => {
  if (live().has(id)) return WORKING;
  const ended = [...kept].reverse().find((one): one is Line => spoken(one) && one.kind === "end");
  return ended ? ended.body : "Stopped";
};

export function current(): Run | null {
  let names: string[];
  try {
    names = fs.readdirSync(RUNS);
  } catch {
    return null;
  }

  const here = active();
  const runs = names
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => {
      const id = name.slice(0, -".jsonl".length);
      let kept: Kept[];
      let touched: number;
      try {
        kept = held(id);
        touched = fs.statSync(file(id)).mtimeMs;
      } catch {
        return null;
      }
      const opened = kept.find((one) => one.kind === "opened");
      if (!opened || ((opened.database ?? MAIN) !== here && !live().has(id))) return null;
      return {
        run: {
          id,
          action: opened.action,
          title: opened.title,
          argument: opened.argument ?? "",
          started: opened.started,
          standing: standing(id, kept),
          model: modelled(kept) ?? null,
          doing: gist(kept),
        },
        touched,
      };
    })
    .filter((one) => one !== null);

  return runs.sort((one, two) => two.touched - one.touched)[0]?.run ?? null;
}

export async function begin({
  action = "",
  argument = "",
  run = null,
  model: picked,
}: {
  action?: string;
  argument?: string;
  run?: string | null;
  model?: string;
}) {
  if (argument.length > LONGEST) throw new Error(`an argument is at most ${LONGEST} characters`);

  const words = argument.trim();
  const id = run ?? randomUUID();
  const kept = run ? held(run) : [];
  const opened = kept.find((one) => one.kind === "opened");
  const named = opened?.action ?? action;
  const database = run ? (opened?.database ?? MAIN) : active();

  if (!runnable(named)) throw new Error(`no such action: ${named}`);
  if (run && live().has(run)) throw new Error("that run is still working");

  const resume = [...kept].reverse().find((one) => one.kind === "session")?.id;
  if (run && !resume) throw new Error("that run cannot be continued");

  const was = modelled(kept);
  const chosen = picked ?? was ?? model();
  if (!MODELS.some(({ key }) => key === chosen)) throw new Error(`no such model: ${chosen}`);

  if (!run) clear();
  if (browses(named)) await script("browser");

  const started = new Date().toISOString();
  if (!run)
    append(id, { kind: "opened", action: named, title: shown(named, words), started, argument: words, database });
  if (chosen !== was) append(id, { kind: "model", key: chosen });
  append(id, { kind: "asked", body: resume ? words : shown(named, words) });

  const child = spawn(
    "claude",
    [
      "-p",
      resume ? words : asked(named, words),
      ...(resume ? ["--resume", resume] : []),
      "--model",
      chosen,
      "--append-system-prompt",
      `${CLOSING}\n\n${BRIEFING}`,
      "--output-format",
      "stream-json",
      "--verbose",
      "--permission-mode",
      "bypassPermissions",
    ],
    { cwd: installed(), env: { ...outermost(process.env), JOB_DATABASE: database }, stdio: ["ignore", "pipe", "pipe"] },
  );

  const one: Live = { child, ended: DONE, hears: new Set() };
  live().set(id, one);
  const keep = (kept: Kept) => {
    if (live().get(id) === one) append(id, kept);
  };

  let rest = "";
  let seen = resume;
  child.stdout.on("data", (chunk: Buffer) => {
    rest += chunk.toString();
    const parts = rest.split("\n");
    rest = parts.pop() ?? "";
    for (const part of parts) {
      if (!part.trim()) continue;
      const { lines, session, standing } = heard(part);
      if (standing && one.ended !== "Stopped") one.ended = standing;
      if (session && !seen) {
        seen = session;
        keep({ kind: "session", id: session });
      }
      for (const line of lines) {
        if (line.kind === "wrong") one.ended = "Failed";
        keep(line);
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => keep({ kind: "aside", body: chunk.toString().trim() }));

  child.on("error", (error) => {
    one.ended = "Failed";
    keep({ kind: "wrong", body: error.message });
  });

  child.on("close", (code) => {
    if (code && one.ended !== "Stopped") {
      one.ended = "Failed";
      keep({ kind: "wrong", body: `claude exited ${code}` });
    }
    keep({ kind: "end", body: one.ended });
    if (live().get(id) === one) live().delete(id);
  });

  return id;
}

export function clear() {
  for (const [id, one] of live()) {
    live().delete(id);
    for (const hears of one.hears) hears({ kind: "end", body: "Stopped" });
    one.child.kill("SIGTERM");
  }
  let names: string[];
  try {
    names = fs.readdirSync(RUNS);
  } catch {
    return;
  }
  for (const name of names) if (name.endsWith(".jsonl")) fs.rmSync(path.join(RUNS, name), { force: true });
}

export function halt(id: string) {
  const one = live().get(id);
  if (!one) return;
  one.ended = "Stopped";
  one.child.kill("SIGTERM");
}

export function haltAll() {
  for (const id of live().keys()) halt(id);
}

export function watch(id: string, signal: AbortSignal) {
  const kept = held(id);
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      let open = true;
      const send = (line: Line) => {
        if (open) controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
      };
      const close = () => {
        if (open) controller.close();
        open = false;
        live().get(id)?.hears.delete(hears);
        signal.removeEventListener("abort", close);
      };

      const hears = (one: Kept) => {
        if (!spoken(one)) return;
        send(one);
        if (one.kind === "end") close();
      };

      for (const one of kept) if (spoken(one)) send(one);

      const one = live().get(id);
      if (!one) return close();
      one.hears.add(hears);
      signal.addEventListener("abort", close);
    },
  });
}
