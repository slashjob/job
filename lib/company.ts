import { z } from "zod";

import { db, one, rows } from "./core/db.ts";
import { TABLES } from "./core/schema.ts";
import { normCompany } from "./core/text.ts";

const Named = TABLES.companies.pick({ id: true, name: true });

const same = (left: string, right: string) =>
  (normCompany(left) || left.trim().toLowerCase()) === (normCompany(right) || right.trim().toLowerCase());

export function companyId(name: string) {
  const held = rows(Named, "SELECT id, name FROM companies").find((row) => same(row.name, name));
  return held?.id ?? Number(db().prepare("INSERT INTO companies(name) VALUES(?)").run(name.trim()).lastInsertRowid);
}

export function company(id: number) {
  const found = one(Named, "SELECT id, name FROM companies WHERE id = ?", [id]);
  if (!found) throw new Error(`no company ${id}; cli/search.ts companies lists them`);
  return found;
}

const Listed = TABLES.companies.pick({ id: true, name: true, website: true, searched_on: true }).extend({
  building: z.string().nullable(),
  articles: z.number(),
  openings: z.number(),
  contacts: z.number(),
});

const STALE = "date('now', '-7 days')";

export const companies = (due: boolean) =>
  rows(
    Listed,
    "SELECT c.id, c.name, c.website, c.searched_on," +
      " (SELECT reason FROM news WHERE company_id = c.id AND status = 'lead'" +
      "   ORDER BY published IS NULL, published DESC LIMIT 1) AS building," +
      " (SELECT count(*) FROM news WHERE company_id = c.id AND status = 'lead') AS articles," +
      " (SELECT count(*) FROM postings WHERE company_id = c.id) AS openings," +
      " (SELECT count(*) FROM contacts WHERE company_id = c.id) AS contacts " +
      "FROM companies c WHERE c.status = 'lead'" +
      (due
        ? " AND EXISTS (SELECT 1 FROM news WHERE company_id = c.id AND status = 'lead')" +
          ` AND (c.searched_on IS NULL OR c.searched_on <= ${STALE}` +
          " OR NOT EXISTS (SELECT 1 FROM contacts WHERE company_id = c.id))"
        : "") +
      " ORDER BY c.found_on DESC, c.id DESC",
  );

export const searched = (id: number, website: string | null) =>
  db()
    .prepare("UPDATE companies SET searched_on = date('now'), website = COALESCE(?, website) WHERE id = ?")
    .run(website, id);

const way = z.string().trim().min(1).nullable().default(null);

const Person = z
  .object({
    name: z.string().trim().min(1, "a contact has a name"),
    title: way,
    why: z.string().trim().min(1, "a contact says why them, in a line"),
    email: way,
    x: way,
    linkedin: way,
  })
  .refine((held) => held.email || held.x || held.linkedin, {
    message: "a contact needs a way to reach them: email, x or linkedin",
  });

export function addContacts(id: number, payload: unknown) {
  company(id);
  const people = z.array(Person).parse(payload);
  const held = db().prepare("SELECT id FROM contacts WHERE company_id = ? AND lower(trim(name)) = lower(?)");
  const insert = db().prepare(
    "INSERT INTO contacts(company_id, name, title, why, email, x, linkedin) VALUES(?, ?, ?, ?, ?, ?, ?)",
  );
  const update = db().prepare(
    "UPDATE contacts SET title = COALESCE(?, title), why = ?, email = COALESCE(?, email)," +
      " x = COALESCE(?, x), linkedin = COALESCE(?, linkedin) WHERE id = ?",
  );
  let added = 0;
  let updated = 0;
  db().transaction(() => {
    for (const person of people) {
      const found = held.get(id, person.name) as { id: number } | undefined;
      if (found) {
        update.run(person.title, person.why, person.email, person.x, person.linkedin, found.id);
        updated++;
      } else {
        insert.run(id, person.name, person.title, person.why, person.email, person.x, person.linkedin);
        added++;
      }
    }
  })();
  return { added, updated };
}

const Contact = TABLES.contacts.pick({
  name: true,
  title: true,
  why: true,
  email: true,
  x: true,
  linkedin: true,
});

export const contacts = (id: number) => {
  company(id);
  return rows(Contact, "SELECT name, title, why, email, x, linkedin FROM contacts WHERE company_id = ? ORDER BY id", [
    id,
  ]);
};
