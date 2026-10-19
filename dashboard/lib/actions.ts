export type Action = {
  id: string;
  does: string;
  argument: string;
  browses: boolean;
  asks?: string;
};

export const ACTIONS: Action[] = [
  { id: "setup", does: "Build your profile", argument: "", browses: false },
  {
    id: "search",
    does: "Search the news for companies and contacts to reach out to",
    argument: "[project]",
    browses: true,
  },
  {
    id: "resume",
    does: "Tailor a resume for a job, or for every job without one",
    argument: "[JD, URL, or key]",
    browses: false,
  },
  {
    id: "apply",
    does: "Fill out the application for one job, for you to submit",
    argument: "<key or URL>",
    browses: true,
  },
  {
    id: "contact",
    does: "Write to someone at a company, about it or one of its jobs",
    argument: "[key or company]",
    browses: true,
  },
];

export const CHAT: Action = {
  id: "chat",
  does: "Talk to Claude",
  argument: "",

  browses: false,
  asks: "Write a message, or type / for an action",
};

const BY_ID = new Map([...ACTIONS, CHAT].map((action) => [action.id, action]));

export const asked = (id: string, argument: string) =>
  id === CHAT.id ? argument : `/job ${id}${argument ? ` ${argument}` : ""}`;

export const unprefixed = (said: string) => said.replace(/^\/job(?=\s|$)\s*/, "");

export const runnable = (id: string) => BY_ID.has(id);

const commands = new Set(ACTIONS.map((action) => action.id));

export const suggested = (said: string): Action[] => {
  if (!said.startsWith("/") || said.includes("\n")) return [];
  const seek = said.trim().toLowerCase();
  return ACTIONS.filter((action) => asked(action.id, "").startsWith(seek) || `/${action.id}`.startsWith(seek));
};

export function commanded(said: string): { action: string; argument: string } | null {
  const parts = said.match(/^\/job(?:\s+(\S+)\s*([\s\S]*?))?\s*$/);
  if (!parts) return null;
  const [, id, argument = ""] = parts;
  if (!id) return { action: "search", argument: "" };
  return commands.has(id) ? { action: id, argument } : null;
}

export const shown = (id: string, argument: string) => (BY_ID.get(id)?.asks ? argument : asked(id, argument));

export const browses = (id: string) => Boolean(BY_ID.get(id)?.browses);

export const describes = (id: string) => BY_ID.get(id)?.does ?? "";
