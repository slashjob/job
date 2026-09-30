import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ROOT } from "./core/root.ts";

const NEW_ISSUE = "https://github.com/slashjob/job/issues/new";

const LONGEST = 7000;

const ran = (command: string, args: string[]) => {
  const done = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" });
  return done.status === 0 ? done.stdout.trim() : "unknown";
};

export function versions() {
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { version: string };
  return [
    `/job: ${version} (${ran("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"])})`,
    `Claude Code: ${ran("claude", ["--version"])}`,
    `Node: ${process.versions.node}`,
    `OS: ${os.type()} ${os.release()} ${os.arch()}`,
  ];
}

export function drafted(title: string, body: string) {
  const footer = `\n\n---\n${versions().join("\n")}`;
  const link = (text: string) => `${NEW_ISSUE}?${new URLSearchParams({ title, body: text + footer })}`;
  const whole = body.trim();
  let text = whole;
  while (link(text).length > LONGEST && text.length) text = text.slice(0, Math.floor(text.length * 0.9));
  const cut = text !== whole;
  return { url: link(cut ? `${text}\n\n(cut short to fit the link)` : text), cut };
}

export function opened(url: string) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
        : ["xdg-open", [url]];
  const child = spawn(command as string, args as string[], { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}
