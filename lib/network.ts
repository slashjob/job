import { z } from "zod";

import { db, rows } from "./core/db.ts";
import { TABLES } from "./core/schema.ts";
import { normCompany } from "./core/text.ts";

const Company = z.object({
  company: z.string(),
  roles: z.string(),
  checked: z.string().nullable(),
});

const maybeText = z
  .preprocess((held) => (typeof held === "string" ? held.trim() || null : (held ?? null)), z.string().nullable())
  .default(null);

const profile = (held: string) => {
  const { origin, pathname } = new URL(held);
  return `${origin}${pathname.replace(/\/+$/, "")}`;
};

const Person = z
  .object({
    name: z.string().trim().min(1, "name cannot be blank"),
    url: z.url().transform(profile),
    title: maybeText,
    degree: TABLES.contacts.shape.degree.default(null),
    introducer: maybeText,
    shared_group: maybeText,
    shared_school: maybeText,
  })
  .refine((held) => held.degree || held.shared_group || held.shared_school, {
    message: "a contact is a 1st or 2nd connection, or shares a group or a school",
    path: ["degree"],
  });

export type Company = z.infer<typeof Company>;

export function companies(named?: string): Company[] {
  const held = rows(
    Company,
    "SELECT company, group_concat(title, ' · ') AS roles," +
      "       (SELECT MAX(found_on) FROM contacts WHERE contacts.company = postings.company) AS checked " +
      `FROM postings ${named ? "" : "WHERE status IN ('applied','interviewing')"} ` +
      "GROUP BY company ORDER BY MAX(last_updated) DESC",
  );
  if (!named) return held;
  const leads = rows(
    Company,
    "SELECT company, '' AS roles," +
      "       (SELECT MAX(found_on) FROM contacts WHERE contacts.company = news.company) AS checked " +
      "FROM news WHERE status IN ('lead','messaged') GROUP BY company",
  );
  return [...held, ...leads].filter((row) => normCompany(row.company) === normCompany(named));
}

export function insert(company: string, payload: unknown) {
  const people = z.array(Person).parse(payload);
  const spelled = companies(company).map((row) => row.company);
  if (!spelled.length)
    throw new Error(`no posting or news lead is held for '${company}'; cli/network.ts companies lists the ones applied to`);

  const drop = db().prepare("DELETE FROM contacts WHERE company=?");
  const add = db().prepare(
    "INSERT OR REPLACE INTO contacts(company,url,name,title,degree,introducer,shared_group,shared_school) " +
      "VALUES(?,?,?,?,?,?,?,?)",
  );

  db().transaction(() => {
    for (const name of spelled) {
      drop.run(name);
      for (const held of people)
        add.run(
          name,
          held.url,
          held.name,
          held.title,
          held.degree,
          held.introducer,
          held.shared_group,
          held.shared_school,
        );
    }
  })();

  return { company: spelled[0], held: people.length };
}
