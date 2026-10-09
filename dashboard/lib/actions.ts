import type { Status } from "./schema.ts";

export type Action = {
  id: string;
  does: string;
  argument: string;
  accepts: Status[];
  browses: boolean;
  asks?: string;
};

const ACTIONS: Action[] = [
  {
    id: "all",
    does: "Run all actions: search, resume, stage",
    argument: "",
    accepts: [],
    browses: true,
  },
  { id: "setup", does: "Build your profile", argument: "", accepts: [], browses: false },
  {
    id: "search",
    does: "Search the job boards for openings that fit your profile",
    argument: "[terms]",
    accepts: [],
    browses: false,
  },
  {
    id: "resume",
    does: "Tailor a resume for one or more job openings",
    argument: "[JD, URL, or key]",
    accepts: ["new", "shortlisted", "skipped", "staged"],
    browses: false,
  },
  {
    id: "apply",
    does: "Fill out a job application",
    argument: "[key or URL]",
    accepts: ["new", "shortlisted", "skipped", "staged"],
    browses: true,
  },
  {
    id: "network",
    does: "Find people at companies you applied to",
    argument: "[company]",
    accepts: [],
    browses: true,
  },
  {
    id: "news",
    does: "Find companies in the news building what you have built",
    argument: "[project]",
    accepts: [],
    browses: false,
  },
  {
    id: "message",
    does: "Write anyone on LinkedIn, for any purpose",
    argument: "[person] [purpose]",
    accepts: [],
    browses: true,
  },
];

export const CHAT: Action = {
  id: "chat",
  does: "Talk to Claude",
  argument: "",
  accepts: [],
  browses: false,
  asks: "Write a message, or type / for an action",
};

const BY_ID = new Map([...ACTIONS, CHAT].map((action) => [action.id, action]));

export const asked = (id: string, argument: string) =>
  id === CHAT.id ? argument : `/job${id === "all" ? "" : ` ${id}`}${argument ? ` ${argument}` : ""}`;

export const runnable = (id: string) => BY_ID.has(id);

const commands = new Set(ACTIONS.map((action) => action.id));

export const suggested = (said: string): Action[] => {
  if (!said.startsWith("/") || said.includes("\n")) return [];
  const seek = said.trim().toLowerCase();
  return ACTIONS.filter((action) => asked(action.id, "").startsWith(seek));
};

export function commanded(said: string): { action: string; argument: string } | null {
  const parts = said.match(/^\/job(?:\s+(\S+)\s*([\s\S]*?))?\s*$/);
  if (!parts) return null;
  const [, id, argument = ""] = parts;
  if (!id) return { action: "all", argument: "" };
  return commands.has(id) ? { action: id, argument } : null;
}

export const shown = (id: string, argument: string) => (BY_ID.get(id)?.asks ? argument : asked(id, argument));

export const browses = (id: string) => Boolean(BY_ID.get(id)?.browses);

export const describes = (id: string) => BY_ID.get(id)?.does ?? "";

export const offered = (status: string | null | undefined) =>
  ACTIONS.filter((action) => action.accepts.some((allowed) => allowed === status));

export function actionsFor(status: string | null | undefined) {
  const ids = offered(status).map((action) => action.id);
  return { resume: ids.filter((id) => id === "resume"), other: ids.filter((id) => id !== "resume") };
}
