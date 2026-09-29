import Glyph from "./Glyph";
import { label, reading } from "@/lib/status";

const STAGE_TEXT: Record<string, string> = {
  waiting: "font-medium text-base-content",
  live: "text-base-content",
  closed: "text-soft",
};

export const Badge = ({ children }: { children: string | null | undefined }) => {
  if (!children) return null;
  const { stage, icon } = reading(children);
  return (
    <span className={`whitespace-nowrap text-xs ${STAGE_TEXT[stage]}`}>
      <Glyph
        icon={icon}
        className={`mr-1.5 inline-block align-[-0.15em] ${stage === "waiting" ? "text-signal" : ""}`}
      />
      {label(children)}
    </span>
  );
};

export const fitTone = (value: number | null) =>
  value === null
    ? "text-soft"
    : value >= 7
      ? "font-semibold text-base-content"
      : value >= 4
        ? "text-base-content"
        : "text-soft";
