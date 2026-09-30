import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Info = { name: string; type: string; notnull: number; pk: number };
type Source = { name: string; table: string | null; column: string | null; type: string | null };

const OUT = path.join(import.meta.dirname, "..", "lib", "db.gen.ts");
const at = process.argv[2] ?? path.join(os.homedir(), "data", "job", "job.db");

if (!fs.existsSync(at)) throw new Error(`no database at ${at}; pass its path`);

const db = new Database(at, { readonly: true, fileMustExist: true });

const named = (type: "table" | "view") =>
  db
    .prepare<[string], { name: string; sql: string }>(
      "SELECT name, sql FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all(type);

const unquote = (literal: string) => literal.slice(1, -1).replaceAll("''", "'");

const allowed = (sql: string, column: string): string[] | null => {
  const found = sql.match(new RegExp(`\\b${column}\\s+IN\\s*\\(([^)]*)\\)`, "i"));
  if (!found) return null;
  const literals = found[1].match(/'(?:[^']|'')*'/g);
  const bare = found[1].replace(/'(?:[^']|'')*'/g, "").replace(/[\s,]/g, "");
  return literals && !bare ? literals.map(unquote) : null;
};

const scalar = (type: string | null) => {
  const affinity = (type ?? "").toUpperCase();
  if (affinity.includes("INT") || affinity.includes("REAL") || affinity.includes("NUM")) return "z.number()";
  if (affinity.includes("TEXT") || affinity.includes("CHAR")) return "z.string()";
  if (affinity.includes("BLOB")) return "z.instanceof(Buffer)";
  return "z.union([z.string(), z.number()])";
};

const tables = new Map(
  named("table").map(({ name, sql }) => {
    const shapes = new Map(
      db
        .prepare<[], Info>(`SELECT name, type, "notnull", pk FROM pragma_table_info('${name}')`)
        .all()
        .map((info) => {
          const options = allowed(sql, info.name);
          const shape = options ? `z.enum(${JSON.stringify(options)})` : scalar(info.type);
          return [info.name, info.notnull || info.pk ? shape : `${shape}.nullable()`];
        }),
    );
    return [name, shapes];
  }),
);

const views = new Map(
  named("view").map(({ name }) => {
    const columns = (db.prepare(`SELECT * FROM "${name}"`).columns() as Source[]).map((source) => {
      const inherited = source.table && source.column && tables.get(source.table)?.get(source.column);
      return [source.name, inherited || `${scalar(source.type)}.nullable()`] as const;
    });
    return [name, new Map(columns)];
  }),
);

const render = (shapes: Map<string, Map<string, string>>) =>
  [...shapes]
    .map(([name, columns]) => {
      const fields = [...columns].map(([column, shape]) => `    ${column}: ${shape},`).join("\n");
      return `  ${name}: z.object({\n${fields}\n  }),`;
    })
    .join("\n");

fs.writeFileSync(
  OUT,
  `import { z } from "zod";

export const TABLES = {
${render(tables)}
};

export const VIEWS = {
${render(views)}
};

export type Table = keyof typeof TABLES;
export type View = keyof typeof VIEWS;
`,
);

console.log(`${path.relative(process.cwd(), OUT)}: ${tables.size} tables, ${views.size} views, from ${at}`);
