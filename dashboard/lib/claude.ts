import path from "node:path";

import { declared, type Standing } from "./standing";

export type Line = { kind: "asked" | "said" | "aside" | "wrong" | "end"; body: string };

export function heard(line: string): { lines: Line[]; session?: string; standing?: Standing } {
  let said: any;
  try {
    said = JSON.parse(line);
  } catch {
    return { lines: [] };
  }

  const session = typeof said.session_id === "string" ? said.session_id : undefined;
  const some = (lines: Line[], standing?: Standing) => ({ lines, session, standing });

  if (said.type === "assistant") {
    const blocks: any[] = said.message?.content ?? [];
    const spoke = blocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    const { body, standing } = declared(spoke);
    return some(body ? [{ kind: "said", body }] : [], standing);
  }

  if (said.type === "result") {
    const body = String(said.result ?? "").trim();
    return some(said.is_error && body ? [{ kind: "wrong", body }] : []);
  }

  if (said.type === "stderr") return some([{ kind: "aside", body: String(said.text).trim() }]);
  if (said.type === "exit" && said.code) return some([{ kind: "wrong", body: `claude exited ${said.code}` }]);
  return some([]);
}

export const outermost = (env: NodeJS.ProcessEnv) =>
  Object.fromEntries([
    ...Object.entries(env).filter(([name]) => !name.startsWith("CLAUDE_CODE") && name !== "CLAUDECODE"),
    [
      "PATH",
      env.PATH?.split(path.delimiter)
        .filter((dir) => !dir.endsWith(path.join("node_modules", ".bin")))
        .join(path.delimiter),
    ],
  ]) as NodeJS.ProcessEnv;
