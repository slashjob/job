"use client";

import { Power } from "lucide-react";
import Glyph from "./Glyph";
import { say } from "./Toaster";
import { Ghost } from "@/components/ui";
import { turnOff } from "@/lib/power";

export default function TurnOff() {
  const off = async () => {
    if (!confirm("Turn off the dashboard? Running conversations stop too.")) return;
    await turnOff();
    say("Dashboard turned off");
  };
  return (
    <Ghost tone="grave" onClick={off} aria-label="Turn off the dashboard" icon={<Glyph icon={Power} size="lg" />} />
  );
}
