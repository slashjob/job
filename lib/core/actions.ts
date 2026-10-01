import type { Status } from "./schema.ts";

export type Action = {
  id: string;
  does: string;
  argument: string;
  accepts: Status[];
};

export const ACTIONS: Action[] = [
  {
    id: "all",
    does: "Run all actions: search, resume, stage",
    argument: "",
    accepts: [],
  },
  {
    id: "install",
    does: "Install what the skill needs",
    argument: "",
    accepts: [],
  },
  {
    id: "setup",
    does: "Build your profile",
    argument: "",
    accepts: [],
  },
  {
    id: "search",
    does: "Search the job boards for new openings, then score them",
    argument: "[terms]",
    accepts: [],
  },
  {
    id: "resume",
    does: "Tailor a resume for one or more job openings",
    argument: "[JD, URL, or key]",
    accepts: ["new", "shortlisted", "skipped", "staged"],
  },
  {
    id: "apply",
    does: "Fill out a job application",
    argument: "[key or URL]",
    accepts: ["new", "shortlisted", "skipped", "staged"],
  },
  {
    id: "network",
    does: "Find people at companies you applied to",
    argument: "[company]",
    accepts: [],
  },
  {
    id: "dashboard",
    does: "Start the local dashboard and open its tab, or stop it",
    argument: "[start|stop|status]",
    accepts: [],
  },
];

const BY_ID = new Map(ACTIONS.map((action) => [action.id, action]));

export function requires(id: string, key: string, status: string | null | undefined) {
  const action = BY_ID.get(id);
  if (!action) throw new Error(`no such action: ${id}`);
  if (action.accepts.some((allowed) => allowed === status)) return;
  throw new Error(`${key} is ${status ?? "unranked"} — /job ${id} takes ${action.accepts.join(" or ")}`);
}
