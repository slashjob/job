"use server";

import { revalidatePath } from "next/cache";

import { script } from "./skill.ts";

type Switched = { name: string } | { error: string };

async function database(args: string[]): Promise<Switched> {
  try {
    await script("database", args);
    revalidatePath("/", "layout");
    return { name: args[1] };
  } catch (error) {
    const said = (error as { stderr?: string }).stderr?.trim() || (error as Error).message;
    return { error: said };
  }
}

export const switchDatabase = async (name: string) => database(["use", name]);

export const createDatabase = async (name: string) => database(["new", name.trim()]);
