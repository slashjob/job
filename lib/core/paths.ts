import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const absolute = (held: string) => path.resolve(held.replace(/^~(?=$|\/)/, os.homedir()));

export const CAREER = path.join(os.homedir(), "data", "job");
export const CHOSEN = path.join(CAREER, "database");
const DATABASES = path.join(CAREER, "databases");
export const MAIN = "main";
export const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;

export const home = (name: string) => (name === MAIN ? CAREER : path.join(DATABASES, name));

const read = (file: string) => {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
};

export function databases() {
  let names: string[] = [];
  try {
    names = fs
      .readdirSync(DATABASES)
      .filter((name) => NAME.test(name) && fs.existsSync(path.join(home(name), "job.db")));
  } catch {}
  return [MAIN, ...names.filter((name) => name !== MAIN).sort()];
}

export const ACTIVE = process.env.JOB_DATABASE || read(CHOSEN) || MAIN;
const HOME = home(ACTIVE);
export const DB = path.join(HOME, "job.db");
const RESUMES = path.join(HOME, "resumes");
export const DOWNLOADS = path.join(CAREER, "downloads");

export const PATHS = {
  career: CAREER,
  db: DB,
  resumes: RESUMES,
  downloads: DOWNLOADS,
};
