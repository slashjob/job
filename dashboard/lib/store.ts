import fs from "node:fs";
import { z } from "zod";

import { one } from "./db.ts";
import { DB } from "./skill.ts";

export type Store = {
  path: string;
  bytes: number;
  logBytes: number;
  modified: number;
  postings: number;
  staged: number;
};

const stat = (file: string) => {
  try {
    return fs.statSync(file);
  } catch {
    return null;
  }
};

const COUNT = z.object({ total: z.number() });

const count = (table: "postings" | "staged") => one(COUNT, `SELECT count(*) AS total FROM ${table}`)?.total ?? 0;

export function store(): Store {
  const postings = count("postings");
  const staged = count("staged");
  const files = [DB, `${DB}-wal`, `${DB}-shm`].flatMap((file) => stat(file) ?? []);
  return {
    path: DB,
    bytes: files.reduce((sum, file) => sum + file.size, 0),
    logBytes: stat(`${DB}-wal`)?.size ?? 0,
    modified: Math.max(...files.map((file) => file.mtimeMs)),
    postings,
    staged,
  };
}
