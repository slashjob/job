import type { Database } from "better-sqlite3";
import { z } from "zod";

export type Column = { sql?: string; takes?: string; kind?: string; note?: string };
export type Shape = {
  note?: string;
  constraints?: string[];
  indexes?: string[];
  singleRow?: boolean;
};

const col = <T extends z.ZodType>(shape: T, meta: Column = {}) => shape.meta(meta) as T;
const dated = "a year, a year and month, or a full date";

const since = (name: string) =>
  `CHECK (${name} IS date(${name}) OR date(${name} || '-01') IS NOT NULL ` +
  `OR date(${name} || '-01-01') IS NOT NULL)`;

const filled = (name: string) => `CHECK (trim(${name}) <> '')`;
const flag = (name: string) => col(z.number().nullable(), { sql: `CHECK (${name} IN (0,1))`, takes: "0 or 1" });
const url = (name: string) => `CHECK (${name} LIKE 'http%://%.%')`;
const owned = (by: string) => `REFERENCES ${by} ON DELETE CASCADE`;

export const TABLES = {
  settings: z.object({
    key: col(z.string(), { sql: "PRIMARY KEY" }),
    value: z.string().nullable(),
  }),

  companies: z
    .object({
      id: col(z.number(), { sql: "PRIMARY KEY AUTOINCREMENT" }),
      name: col(z.string(), { sql: `${filled("name")} UNIQUE COLLATE NOCASE` }),
      website: col(z.string().nullable(), { sql: url("website"), takes: "a URL, starting http" }),
      status: col(z.enum(["lead", "passed"]), { sql: "DEFAULT 'lead'" }),
      found_on: col(z.string(), {
        sql: "DEFAULT (date('now')) CHECK (found_on IS date(found_on))",
        takes: "a date, as YYYY-MM-DD",
      }),
      searched_on: col(z.string().nullable(), {
        sql: "CHECK (searched_on IS date(searched_on))",
        takes: "a date, as YYYY-MM-DD",
      }),
    })
    .meta({
      note:
        "Every company the search turned up: the news about it, its openings and the\n" +
        "people worth writing to hang off it. `searched_on` is the day its openings were\n" +
        "last looked for; `passed` keeps it from coming back.",
      indexes: ["idx_companies_status ON companies(status)"],
    } satisfies Shape),

  postings: z
    .object({
      key: col(z.string(), { sql: "PRIMARY KEY" }),
      source: z.string(),
      company: z.string(),
      company_id: col(z.number(), { sql: owned("companies(id)") }),
      title: z.string(),
      url: col(z.string().nullable(), {
        sql: url("url"),
        takes: "a URL, starting http",
      }),
      location: z.string().nullable(),
      remote: flag("remote"),
      compensation: z.string().nullable(),
      posted_at: col(z.string().nullable(), {
        sql: "CHECK (posted_at IS NULL OR datetime(posted_at) IS NOT NULL)",
        takes: "a timestamp",
      }),
      description: z.string().nullable(),
      first_fetched: col(z.string(), {
        sql: "DEFAULT (date('now')) CHECK (first_fetched IS date(first_fetched))",
        takes: "a date, as YYYY-MM-DD",
      }),
      last_fetched: col(z.string(), {
        sql: "DEFAULT (date('now')) CHECK (last_fetched IS date(last_fetched))",
        takes: "a date, as YYYY-MM-DD",
      }),
      ingested_on: col(z.string().nullable(), {
        sql: "CHECK (ingested_on IS date(ingested_on))",
        takes: "a date, as YYYY-MM-DD",
      }),
      last_updated: col(z.string().nullable(), {
        sql: "CHECK (last_updated IS date(last_updated))",
        takes: "a date, as YYYY-MM-DD",
      }),
      resume: z.string().nullable(),
    })
    .meta({
      indexes: ["idx_postings_updated ON postings(last_updated)"],
    } satisfies Shape),

  identity: z
    .object({
      full_name: col(z.string().nullable(), { sql: filled("full_name") }),
      preferred_name: col(z.string().nullable(), {
        sql: filled("preferred_name"),
      }),
      last_name: col(z.string().nullable(), { sql: filled("last_name") }),
      email: col(z.string().nullable(), {
        sql: "CHECK (email LIKE '_%@_%._%')",
        takes: "an email address",
      }),
      phone: col(z.string().nullable(), {
        sql: "CHECK (NOT phone GLOB '*[A-Za-z]*' AND length(phone) >= 7)",
        takes: "a phone number — digits and separators, no words",
      }),
      location: col(z.string().nullable(), { sql: filled("location") }),
      street_address: col(z.string().nullable(), {
        sql: filled("street_address"),
      }),
      linkedin: col(z.string().nullable(), {
        sql: url("linkedin"),
        takes: "a URL, starting http",
      }),
      github: col(z.string().nullable(), {
        sql: url("github"),
        takes: "a URL, starting http",
      }),

      authorized_in_country_of_residence: flag("authorized_in_country_of_residence"),
      legal_right_to_work_without_sponsorship: flag("legal_right_to_work_without_sponsorship"),
      requires_sponsorship_now_or_future: flag("requires_sponsorship_now_or_future"),
      over_18: flag("over_18"),

      earliest_daily_start: col(z.string().nullable(), {
        sql:
          "CHECK (earliest_daily_start GLOB '[0-2][0-9]:[0-5][0-9]'\n" +
          "                                       AND earliest_daily_start <= '23:59')",
        takes: "a 24-hour time, as HH:MM",
      }),
      notice_period: z.enum(["none", "1_week", "2_weeks", "3_weeks", "1_month", "2_months", "3_months"]).nullable(),
      employment_type: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).nullable(),
      remote_preference: z.enum(["remote", "hybrid", "on_site", "no_preference"]).nullable(),
      willing_to_relocate: flag("willing_to_relocate"),
      compensation_floor: col(z.number().nullable(), {
        sql: "CHECK (compensation_floor >= 0)",
        takes: "a whole number, 0 or more",
      }),
      compensation_currency: col(z.string().nullable(), {
        sql: "CHECK (compensation_currency GLOB '[A-Z][A-Z][A-Z]')",
        takes: "a three-letter currency code, like USD",
      }),

      gender: z.enum(["male", "female", "non_binary", "decline_to_say"]).nullable(),
      race_ethnicity: z
        .enum([
          "american_indian_or_alaska_native",
          "asian",
          "black_or_african_american",
          "hispanic_or_latino",
          "native_hawaiian_or_pacific_islander",
          "white",
          "two_or_more_races",
          "decline_to_say",
        ])
        .nullable(),
      hispanic_or_latino: z.enum(["yes", "no", "decline_to_say"]).nullable(),
      veteran_status: z.enum(["protected_veteran", "not_a_protected_veteran", "decline_to_say"]).nullable(),
      disability_status: z.enum(["yes", "no", "decline_to_say"]).nullable(),
    })
    .meta({
      singleRow: true,
      note:
        "Who the applicant is, in the order a form asks: contact, then the yes/no\n" +
        "questions every form repeats, then when you could start, then the optional\n" +
        "ones. Declining to say is a real answer rather than a missing one, which is\n" +
        "why the last five are choices and not flags.",
    } satisfies Shape),

  education: z
    .object({
      id: col(z.number(), { sql: "PRIMARY KEY AUTOINCREMENT" }),
      degree: col(z.string(), { sql: filled("degree") }),
      institution: col(z.string().nullable(), { sql: filled("institution") }),
      start: col(z.string().nullable(), { sql: since("start"), takes: dated }),
      finished: col(z.string().nullable(), {
        sql: since("finished"),
        takes: dated,
      }),
    })
    .meta({
      note:
        "`start`, `finished` and the career dates below are as precise as the user was: a year,\n" +
        "a year and month, or a full date. A resume prints months, so demanding a day\n" +
        "would invent one.",
    } satisfies Shape),

  employers: z.object({
    id: col(z.number(), { sql: "PRIMARY KEY AUTOINCREMENT" }),
    name: col(z.string(), { sql: filled("name") }),
    title: col(z.string().nullable(), { sql: filled("title") }),
    start: col(z.string().nullable(), { sql: since("start"), takes: dated }),
    finish: col(z.string().nullable(), {
      sql: since("finish"),
      takes: dated,
    }),
    about: z.string().nullable(),
    seq: col(z.number().nullable(), {
      sql: "CHECK (seq >= 0)",
      takes: "a whole number, 0 or more",
    }),
  }),

  projects: z
    .object({
      id: col(z.number(), { sql: "PRIMARY KEY AUTOINCREMENT" }),
      employer_id: col(z.number(), { sql: owned("employers(id)") }),
      name: col(z.string(), { sql: filled("name") }),
      start: col(z.string().nullable(), { sql: since("start"), takes: dated }),
      finish: col(z.string().nullable(), {
        sql: since("finish"),
        takes: dated,
      }),
      about: z.string().nullable(),
      seq: col(z.number().nullable(), {
        sql: "CHECK (seq >= 0)",
        takes: "a whole number, 0 or more",
      }),
    })
    .meta({
      note:
        "The only source a resume may draw from. A correction lives on the row it corrects --\n" +
        "a wrong number in `about`, a wrong title on `employers` -- so there is one place\n" +
        "to read and nothing to reconcile.",
    } satisfies Shape),

  project_technologies: z
    .object({
      project_id: col(z.number(), { sql: owned("projects(id)") }),
      technology: z.string(),
    })
    .meta({
      note: "What a JD is matched against when selecting what to write about.",
      constraints: ["PRIMARY KEY (project_id, technology)"],
    } satisfies Shape),

  instructions: z
    .object({
      text: col(z.string().nullable(), { sql: filled("text") }),
    })
    .meta({
      singleRow: true,
      note:
        "What to do with everything above: the prose the search is typed from and\n" +
        "every opening is judged against. One reader reads it, and typed columns only\n" +
        "flatten the slopes it describes into walls.",
    } satisfies Shape),

  news: z
    .object({
      article_id: col(z.string(), { sql: "PRIMARY KEY" }),
      title: col(z.string(), { sql: filled("title") }),
      url: col(z.string(), { sql: url("url"), takes: "a URL, starting http" }),
      source: z.string().nullable(),
      published: col(z.string().nullable(), {
        sql: "CHECK (published IS NULL OR datetime(published) IS NOT NULL)",
        takes: "a timestamp",
      }),
      summary: z.string().nullable(),
      image: col(z.string().nullable(), { sql: url("image"), takes: "a URL, starting http" }),
      found_on: col(z.string(), {
        sql: "DEFAULT (date('now')) CHECK (found_on IS date(found_on))",
        takes: "a date, as YYYY-MM-DD",
      }),
      status: col(z.enum(["new", "lead", "noise"]), { sql: "DEFAULT 'new'" }),
      company_id: col(z.number().nullable(), { sql: owned("companies(id)") }),
      reason: z.string().nullable(),
    })
    .meta({
      note:
        "Articles read off Google News, each judged once. A lead is a company building\n" +
        "what the user's projects already built: `news_projects` names them and\n" +
        "`reason` says why, in a line.",
      constraints: ["CHECK (status IN ('new','noise') OR (company_id IS NOT NULL AND reason IS NOT NULL))"],
      indexes: ["idx_news_status ON news(status)", "idx_news_company ON news(company_id)"],
    } satisfies Shape),

  news_projects: z
    .object({
      article_id: col(z.string(), { sql: owned("news(article_id)") }),
      project_id: col(z.number(), { sql: owned("projects(id)") }),
    })
    .meta({
      note: "Every project that built what a lead's company is building.",
      constraints: ["PRIMARY KEY (article_id, project_id)"],
      indexes: ["idx_news_projects_project ON news_projects(project_id)"],
    } satisfies Shape),

  contacts: z
    .object({
      id: col(z.number(), { sql: "PRIMARY KEY AUTOINCREMENT" }),
      company_id: col(z.number(), { sql: owned("companies(id)") }),
      name: col(z.string(), { sql: filled("name") }),
      title: z.string().nullable(),
      why: col(z.string(), { sql: filled("why") }),
      email: col(z.string().nullable(), {
        sql: "CHECK (email LIKE '_%@_%._%')",
        takes: "an email address",
      }),
      x: col(z.string().nullable(), { sql: url("x"), takes: "a URL, starting http" }),
      linkedin: col(z.string().nullable(), { sql: url("linkedin"), takes: "a URL, starting http" }),
      found_on: col(z.string(), {
        sql: "DEFAULT (date('now')) CHECK (found_on IS date(found_on))",
        takes: "a date, as YYYY-MM-DD",
      }),
    })
    .meta({
      note:
        "The one or two people at a company worth writing to, and every way to reach\n" +
        "them that is published. `why` is what makes them the one.",
      constraints: ["CHECK (COALESCE(email, x, linkedin) IS NOT NULL)"],
      indexes: ["idx_contacts_company ON contacts(company_id)"],
    } satisfies Shape),

  summary: z
    .object({
      text: col(z.string().nullable(), { sql: filled("text") }),
    })
    .meta({
      singleRow: true,
      note:
        "Who the user is on paper, in two or three lines: what every resume summary\n" +
        "starts from. It holds no count of years -- `experience` supplies that.",
    } satisfies Shape),
};

export type Table = keyof typeof TABLES;

export const ORDER: Table[] = [
  "settings",
  "companies",
  "postings",
  "identity",
  "education",
  "employers",
  "projects",
  "project_technologies",
  "news",
  "news_projects",
  "contacts",
  "instructions",
  "summary",
];

const int = z.number();
const text = z.string();

export const VIEWS = {
  prospects: TABLES.postings.pick({
    key: true,
    company: true,
    company_id: true,
    title: true,
    url: true,
    location: true,
    remote: true,
    compensation: true,
    posted_at: true,
    last_updated: true,
    source: true,
    description: true,
    resume: true,
  }),
  triage: TABLES.postings.pick({
    key: true,
    company: true,
    company_id: true,
    title: true,
    location: true,
    remote: true,
    compensation: true,
    posted_at: true,
    last_updated: true,
    source: true,
    resume: true,
    url: true,
  }),
  answers: z.object({
    section: text,
    field: text,
    value: z.union([text, int]).nullable(),
  }),
  unanswered: z.object({ section: text, field: text }),
  experience: z.object({
    clock_starts: text.nullable(),
    years: int.nullable(),
    relevant_years: int.nullable(),
  }),
  career: z.object({
    employer: text,
    role: text.nullable(),
    employer_start: text.nullable(),
    employer_end: text.nullable(),
    project_id: int,
    project: text,
    about: text.nullable(),
    technologies: text.nullable(),
  }),
};

export const DERIVED: Partial<Record<keyof typeof VIEWS, { where?: string; order?: string }>> = {
  prospects: {},
  triage: { order: "last_updated DESC" },
};

export const bare = (shape: z.ZodType): z.ZodType =>
  shape instanceof z.ZodNullable ? bare(shape.unwrap() as z.ZodType) : shape;

const shapeOf = (table: Table, column: string) => TABLES[table].shape[column as never] as z.ZodType | undefined;

const meta = (table: Table, column: string) => (shapeOf(table, column)?.meta() ?? {}) as Column;

export const options = (table: Table, column: string): string[] => {
  const inner = bare(shapeOf(table, column) ?? text);
  return inner instanceof z.ZodEnum ? inner.options.map(String) : [];
};

export const SECTIONS = ORDER.filter((table) => (TABLES[table].meta() as Shape | undefined)?.singleRow);

export const columns = (table: Table) => Object.keys(TABLES[table].shape);

export function takes(table: Table, column: string) {
  const listed = options(table, column);
  if (listed.length) return `one of ${listed.join(", ")}`;
  const said = meta(table, column).takes;
  if (said) return said;
  return bare(shapeOf(table, column) ?? text) instanceof z.ZodNumber
    ? "a whole number"
    : "anything but an empty answer";
}

type Held = { name: string; notnull: number; pk: number; hidden: number };

export function align(database: Database) {
  const wrong: string[] = [];
  for (const [name, shape] of Object.entries({ ...TABLES, ...VIEWS })) {
    const found = database.pragma(`table_xinfo(${name})`) as Held[];
    const declared = Object.keys(shape.shape);
    const single = (shape.meta() as Shape | undefined)?.singleRow;
    const expected = single ? ["id", ...declared] : declared;

    const missing = found.map((column) => column.name).filter((column) => !expected.includes(column));
    const extra = expected.filter((column) => !found.some((held) => held.name === column));
    if (missing.length) wrong.push(`${name}: not declared — ${missing.join(", ")}`);
    if (extra.length) wrong.push(`${name}: no such column — ${extra.join(", ")}`);

    if (!(name in TABLES)) continue;
    for (const column of found) {
      const held = shape.shape[column.name as never] as z.ZodType | undefined;
      if (!held || column.hidden) continue;
      const nullable = !column.notnull && !column.pk;
      if (held.safeParse(null).success !== nullable)
        wrong.push(`${name}.${column.name}: SQL says ${nullable ? "nullable" : "NOT NULL"}`);
    }
  }
  if (wrong.length)
    throw new Error(
      `the database has drifted from lib/core/schema.ts:\n${wrong.join("\n")}\n\n` +
        "Nothing migrates on connect, and no script in cli/ can open a database this refused. " +
        "Migrate it with sqlite3 directly: DROP COLUMN one the database has and nothing " +
        "declares, ADD COLUMN one that is declared and the database lacks.",
    );
}
