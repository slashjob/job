import Field from "@/components/edit/Field";
import { YES_NO, title, type Column } from "@/components/edit/columns";
import { Card, Group, Sheet, type Note } from "@/components/ui";
import { identity, instructions, options, summary } from "@/lib/queries";
import { grouped, hint } from "./identity";

const held = () => identity() as unknown as Record<string, unknown>;

const asked = (name: string): Column => {
  const { flag, ...hinted } = hint(name);
  const listed = options("identity", name);
  return { name, ...hinted, options: flag ? YES_NO : listed.length ? listed : undefined };
};

const noted =
  (row: Record<string, unknown>) =>
  (column: Column): Note => {
    const answer = (row[column.name] ?? null) as string | number | null;
    return {
      label: title(column),
      mark: answer === null,
      value: (
        <Field
          table="identity"
          rowid={1}
          value={answer}
          column={{
            ...column,
            blocking: true,
            label: title(column),
            className: column.options ? "max-w-64" : "max-w-xl",
            placeholder: column.placeholder ?? "—",
          }}
        />
      ),
    };
  };

const SUMMARY: Column = {
  name: "text",
  kind: "area",
  preview: true,
  rows: 3,
  placeholder: "Drafted at the end of setup",
};

export const Summary = () => (
  <Group heading="Summary">
    <Card soft>
      <Field table="summary" rowid={1} column={SUMMARY} value={summary().text} />
    </Card>
  </Group>
);

export function Identity() {
  const note = noted(held());
  return (
    <>
      {grouped().map((group) => (
        <Group key={group.label} heading={group.label}>
          <Sheet label="10rem" notes={group.names.map(asked).map(note)} />
        </Group>
      ))}
    </>
  );
}

const INSTRUCTIONS: Column = {
  name: "text",
  kind: "area",
  preview: true,
  className: "pane-max",
  placeholder:
    "Titles to look for, strongest first. Then the seniority you want, what makes an " +
    "opening worth applying to, and what rules one out.",
};

export function Instructions() {
  return (
    <Card soft>
      <Field table="instructions" rowid={1} column={INSTRUCTIONS} value={instructions().text} />
    </Card>
  );
}
