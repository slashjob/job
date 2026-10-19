"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Command } from "@/components/act";
import { useDock } from "@/components/Dock";
import { Button, Tip } from "@/components/ui";
import { describes } from "@/lib/actions";

const shownKey = (id: string, argument: string) => `${id}\n${argument}`;

const Shown = createContext<{ shown: string[]; show: (keys: string[]) => () => void }>({
  shown: [],
  show: () => () => {},
});

export function ShownActions({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<string[]>([]);
  const show = useCallback((keys: string[]) => {
    setShown((held) => [...held, ...keys]);
    return () => setShown((held) => keys.reduce((left, key) => left.toSpliced(left.indexOf(key), 1), held));
  }, []);
  return <Shown.Provider value={{ shown, show }}>{children}</Shown.Provider>;
}

export function useShownAction() {
  const { shown } = useContext(Shown);
  return (id: string, argument: string) => shown.includes(shownKey(id, argument));
}

export default function Actions({ ids, argument = "" }: { ids: string[]; argument?: string }) {
  const { draft } = useDock();
  const { show } = useContext(Shown);
  const keys = ids.map((id) => shownKey(id, argument)).join("\0");

  useEffect(() => show(keys ? keys.split("\0") : []), [show, keys]);

  if (ids.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <Tip key={id} tip={describes(id)}>
          <Button onClick={() => draft(id, argument)}>
            <Command id={id} />
          </Button>
        </Tip>
      ))}
    </div>
  );
}
