import { Command } from "commander";
import { z } from "zod";

import { open } from "../lib/core/db.ts";

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const said = (error: unknown) => {
  if (error instanceof z.ZodError)
    return error.issues.map((issue) => `${issue.path.join(".") || "(row)"}: ${issue.message}`).join("\n");
  return error instanceof Error ? error.message : String(error);
};

export function guard(run: (...args: any[]) => unknown | Promise<unknown>) {
  return async (...args: any[]) => {
    try {
      await run(...args);
    } catch (error) {
      fail(said(error));
    }
  };
}

export function action(name: string, description: string) {
  const program = new Command(name).description(description).option("--db <path>");
  const runs = (run: (...args: any[]) => unknown | Promise<unknown>) =>
    guard((...args: any[]) => {
      open(program.opts().db);
      return run(...args);
    });
  return { program, runs };
}
