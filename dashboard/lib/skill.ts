import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const absolute = (held: string) => path.resolve(held.replace(/^~(?=$|\/)/, os.homedir()));

const SKILL = path.join(os.homedir(), ".claude", "skills", "job");
export const CAREER = absolute(process.env.JOB_CAREER_DIR || "~/data/job");
export const DB = path.join(CAREER, "job.db");

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
