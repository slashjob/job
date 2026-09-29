import type { z } from "zod";
import {
  Check,
  Circle,
  CircleAlert,
  CircleDashed,
  CircleDot,
  MessagesSquare,
  Minus,
  Send,
  SkipForward,
  X,
  type LucideIcon,
} from "lucide-react";

import { TABLES, type Status } from "./schema.ts";

type FormStatus = NonNullable<z.infer<typeof TABLES.staged.shape.status>>;

type Stage = "waiting" | "live" | "closed";

type Reading = { stage: Stage; icon: LucideIcon };

const READINGS: Record<Status, Reading> = {
  shortlisted: { stage: "waiting", icon: CircleDot },
  staged: { stage: "waiting", icon: Send },
  interviewing: { stage: "live", icon: MessagesSquare },
  applied: { stage: "live", icon: Check },
  new: { stage: "live", icon: Circle },
  rejected: { stage: "closed", icon: X },
  passed: { stage: "closed", icon: Minus },
  skipped: { stage: "closed", icon: SkipForward },
};

const FORM_READINGS: Record<FormStatus, Reading> = {
  ready: { stage: "waiting", icon: Send },
  blocked: { stage: "waiting", icon: CircleAlert },
};

const UNKNOWN: Reading = { stage: "closed", icon: CircleDashed };

const ALL: Record<string, Reading> = { ...READINGS, ...FORM_READINGS };

export const reading = (status: string | null | undefined): Reading => (status && ALL[status]) || UNKNOWN;

export const label = (status: string) => status.replace(/_/g, " ");

type Shelved = { status: string | null; blocked_on: string | null };

type Shelf = { name: string; holds: (job: Shelved) => boolean; framed?: boolean; brief?: boolean; folded?: boolean };

const among =
  (...statuses: Status[]) =>
  (job: Shelved) =>
    statuses.some((status) => status === job.status);

export const SHELVES: Shelf[] = [
  { name: "Needs your input", holds: (job) => job.status === "staged" && Boolean(job.blocked_on), framed: true },
  { name: "Ready to submit", holds: (job) => job.status === "staged" && !job.blocked_on, framed: true },
  { name: "Worth applying to", holds: among("shortlisted") },
  { name: "Not scored yet", holds: among("new") },
  { name: "Applied", holds: among("interviewing", "applied"), brief: true },
  { name: "Rejected", holds: among("rejected"), brief: true, folded: true },
  { name: "Not moving forward", holds: among("passed", "skipped"), brief: true, folded: true },
];
