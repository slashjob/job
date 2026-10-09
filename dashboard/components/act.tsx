"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { answered, reported } from "@/components/edit/answered";
import { asked } from "@/lib/actions";
import { say } from "@/components/Toaster";
import { discard, dropTopic, forget, pass, save } from "@/lib/edit";

export const copyKey = (key: string) =>
  navigator.clipboard.writeText(key).then(
    () => say("Job ID copied"),
    () => say("Could not copy the job ID", true),
  );

export const Command = ({ id, argument = "" }: { id: string; argument?: string }) => (
  <span className="font-mono">
    <span className="text-soft">/job</span>
    {asked(id, argument).slice("/job".length)}
  </span>
);

export function useDiscard() {
  const router = useRouter();
  return useCallback(
    async (key: string) => {
      const result = await answered(discard(key));
      if (reported(result)) return;
      say("deleted");
      router.refresh();
    },
    [router],
  );
}

export function useForget() {
  const router = useRouter();
  return useCallback(
    async (company: string, url: string) => {
      const result = await answered(forget(company, url));
      if (reported(result)) return;
      say("deleted");
      router.refresh();
    },
    [router],
  );
}

export function usePass() {
  const router = useRouter();
  return useCallback(
    async (article_id: string) => {
      const result = await answered(pass(article_id));
      if (reported(result)) return;
      say("deleted");
      router.refresh();
    },
    [router],
  );
}

export function useDropTopic() {
  const router = useRouter();
  return useCallback(
    async (project_id: number) => {
      const result = await answered(dropTopic(project_id));
      if (reported(result)) return;
      say("deleted");
      router.refresh();
    },
    [router],
  );
}

export function usePause() {
  const router = useRouter();
  return useCallback(
    async (project_id: number, paused: boolean) => {
      const result = await answered(save("news_topics", project_id, { paused: paused ? "1" : "0" }));
      if (reported(result)) return;
      say(paused ? "paused" : "resumed");
      router.refresh();
    },
    [router],
  );
}
