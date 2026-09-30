import { z } from "zod";

import { TABLES, VIEWS, type Table } from "./db.gen.ts";

export { TABLES, VIEWS, type Table };

export type Status = NonNullable<z.infer<typeof TABLES.postings.shape.status>>;

export const bare = (shape: z.ZodType): z.ZodType =>
  shape instanceof z.ZodNullable ? bare(shape.unwrap() as z.ZodType) : shape;

export const options = (table: Table, column: string): string[] => {
  const inner = bare((TABLES[table].shape[column as never] as z.ZodType | undefined) ?? z.string());
  return inner instanceof z.ZodEnum ? inner.options.map(String) : [];
};
