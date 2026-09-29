import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

import { ROOT } from "./core/root.ts";

const WINDOWS = process.platform === "win32";

const PACKAGES = [ROOT, path.join(ROOT, "dashboard")];

const git = (args: string[]) =>
  spawnSync("git", ["-C", ROOT, ...args], { encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });

export function update() {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch.error || branch.status) return "not a git checkout, so not updated";
  if (branch.stdout.trim() !== "main") return `on ${branch.stdout.trim()}, not main, so not updated`;
  if (git(["status", "--porcelain"]).stdout.trim()) return "local changes, so not updated";
  const before = git(["rev-parse", "HEAD"]).stdout.trim();
  const pulled = git(["pull", "--ff-only"]);
  if (pulled.status) throw new Error(`updating failed:\n${pulled.stderr}`);
  return git(["rev-parse", "HEAD"]).stdout.trim() === before ? "already the latest" : "updated to the latest";
}

export function dependencies() {
  for (const at of PACKAGES) {
    const ran = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: at, encoding: "utf8", shell: WINDOWS });
    if (ran.error) throw new Error(`npm is not on PATH, so nothing in ${at} was installed`);
    if (ran.status) throw new Error(`npm install failed in ${at}:\n${ran.stderr}`);
  }
}

const claude = (args: string[]) => spawnSync("claude", args, { cwd: os.homedir(), encoding: "utf8", shell: WINDOWS });

export async function browserTools() {
  const { ENDPOINT } = await import("./core/browser.ts");
  const tools = [...(WINDOWS ? ["cmd", "/c"] : []), "npx", "@playwright/mcp@latest", "--cdp-endpoint", ENDPOINT];
  const adding = `claude mcp add --scope user playwright -- ${tools.join(" ")}`;
  const configured = claude(["mcp", "get", "playwright"]);
  if (configured.error) throw new Error(`claude is not on PATH, so the browser tools were not added. Run: ${adding}`);
  if (configured.status === 0) {
    if (configured.stdout.includes(ENDPOINT)) return false;
    const removing = configured.stdout.match(/run: (claude mcp remove .+)/)?.[1] ?? "claude mcp remove playwright";
    throw new Error(
      `an MCP server named playwright is already configured without --cdp-endpoint ${ENDPOINT}, so it would ` +
        `open a browser of its own rather than the one cli/browser.ts runs. Run ${removing}, then: ${adding}`,
    );
  }
  const added = claude(["mcp", "add", "--scope", "user", "playwright", "--", ...tools]);
  if (added.status) throw new Error(`adding the browser tools failed:\n${added.stderr}`);
  return true;
}

export async function browser() {
  const { ensure, ENDPOINT } = await import("./core/browser.ts");
  const { browser } = await ensure();
  return `${browser} on ${ENDPOINT}`;
}
