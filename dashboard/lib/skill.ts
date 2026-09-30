import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const absolute = (held: string) => path.resolve(held.replace(/^~(?=$|\/)/, os.homedir()));

const SKILL = path.join(os.homedir(), ".claude", "skills", "job");
export const CAREER = path.join(os.homedir(), "data", "job");
const CHOSEN = path.join(CAREER, "database");
const DATABASES = path.join(CAREER, "databases");
export const MAIN = "main";

const home = (name: string) => (name === MAIN ? CAREER : path.join(DATABASES, name));
const kept = (name: string) => /^[a-z0-9][a-z0-9-]{0,39}$/.test(name) && fs.existsSync(path.join(home(name), "job.db"));

export function databases() {
  let names: string[] = [];
  try {
    names = fs.readdirSync(DATABASES).filter((name) => name !== MAIN && kept(name));
  } catch {}
  return [MAIN, ...names.sort()];
}

export function active() {
  let named = "";
  try {
    named = fs.readFileSync(CHOSEN, "utf8").trim();
  } catch {}
  return named && named !== MAIN && kept(named) ? named : MAIN;
}

export const database = () => path.join(home(active()), "job.db");

export function installed() {
  if (!fs.existsSync(path.join(SKILL, "SKILL.md")))
    throw new Error(`the job skill is not installed at ${SKILL}; install it first, as the README says`);
  return SKILL;
}

const executed = promisify(execFile);

export async function script(name: string, args: string[] = []) {
  const { stdout } = await executed(path.join(installed(), "cli", `${name}.ts`), args, { cwd: SKILL });
  return stdout;
}
