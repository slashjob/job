"use client";

import { useRouter } from "next/navigation";
import { DeleteMenu } from "@/components/Options";
import { say } from "@/components/Toaster";
import { confirmDelete } from "@/components/ui";
import { remove } from "@/lib/edit";
import { answered, reported } from "./answered";

export default function RemoveMenu({
  table,
  rowid,
  name,
  noun,
  warning,
  then,
}: {
  table: string;
  rowid: number;
  name: string;
  noun: string;
  warning?: string;
  then?: string;
}) {
  const router = useRouter();

  const erase = async () => {
    if (!confirmDelete(warning ?? name)) return;
    if (reported(await answered(remove(table, rowid)))) return;
    say("deleted");
    if (then) router.push(then);
    router.refresh();
  };

  return <DeleteMenu what={name} label={`Delete ${noun}`} onPick={erase} />;
}
