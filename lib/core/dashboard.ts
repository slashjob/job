import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { ENDPOINT as BROWSER, ensure as ensureBrowser } from "./browser.ts";
import { CAREER } from "./db.ts";
import { ROOT } from "./root.ts";

export const PORT = Number(process.env.JOB_DASHBOARD_PORT) || 8765;
export const ENDPOINT = `http://127.0.0.1:${PORT}`;

const DASHBOARD = path.join(ROOT, "dashboard");
const PIDFILE = path.join(CAREER, "dashboard.pid");
const WINDOWS = process.platform === "win32";

export async function running(): Promise<boolean> {
  try {
    const answered = await fetch(ENDPOINT, { signal: AbortSignal.timeout(1000) });
    return answered.status < 500;
  } catch {
    return false;
  }
}

export async function ensure(): Promise<{ started: boolean }> {
  if (await running()) return { started: false };

  fs.mkdirSync(CAREER, { recursive: true });
  const child = spawn("npm", ["run", "dev"], {
    cwd: DASHBOARD,
    detached: true,
    stdio: "ignore",
    shell: WINDOWS,
  });
  child.unref();
  fs.writeFileSync(PIDFILE, String(child.pid));

  const until = Date.now() + 20000;
  while (Date.now() < until) {
    if (await running()) return { started: true };
    await new Promise((wake) => setTimeout(wake, 250));
  }
  throw new Error(`dashboard never answered on ${ENDPOINT}; run "npm run dev" in ${DASHBOARD} to see why`);
}

export async function focus(): Promise<{ opened: boolean }> {
  await ensureBrowser();
  const tabs = (await (await fetch(`${BROWSER}/json/list`)).json()) as Tab[];
  const held = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(ENDPOINT));
  const tab = held ?? ((await (await fetch(`${BROWSER}/json/new?${ENDPOINT}`, { method: "PUT" })).json()) as Tab);
  await bringToFront(tab);
  return { opened: !held };
}

type Tab = { id: string; type: string; url: string; webSocketDebuggerUrl: string };

function bringToFront(tab: Tab): Promise<void> {
  return new Promise((done, failed) => {
    const socket = new WebSocket(tab.webSocketDebuggerUrl);
    socket.onopen = () => socket.send(JSON.stringify({ id: 1, method: "Page.bringToFront" }));
    socket.onmessage = () => {
      socket.close();
      done();
    };
    socket.onerror = () => failed(new Error(`could not bring the dashboard tab to the front over ${BROWSER}`));
  });
}

export function stop(): boolean {
  if (!fs.existsSync(PIDFILE)) return false;
  const pid = Number(fs.readFileSync(PIDFILE, "utf8"));
  fs.rmSync(PIDFILE, { force: true });
  if (!pid) return false;
  try {
    if (WINDOWS) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"]);
    else process.kill(-pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}
