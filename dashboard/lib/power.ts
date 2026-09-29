"use server";

import { haltAll } from "./runs";

export async function turnOff() {
  haltAll();
  setTimeout(() => process.exit(0), 500);
}
