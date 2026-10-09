import { Caret } from "@/components/ui";

export default function Wordmark({
  size = 17,
  working = false,
  waiting = false,
  className = "",
}: {
  size?: number;
  working?: boolean;
  waiting?: boolean;
  className?: string;
}) {
  return (
    <span
      style={{ fontSize: size }}
      className={`inline-flex shrink-0 items-center font-mono font-normal
        leading-none tracking-tight ${className}`}
    >
      <span className="text-soft">/</span>
      <span className="font-semibold text-base-content">job</span>
      {waiting ? (
        <span
          className="ml-[0.14em] inline-flex h-[0.95em] min-w-[0.5em] animate-arrive items-center
            justify-center px-[0.16em] lit font-semibold text-mark-content"
          style={{ fontSize: "0.8em" }}
        >
          ?
        </span>
      ) : (
        <span className="ml-[0.14em] inline-flex">
          <Caret blink={working} />
        </span>
      )}
    </span>
  );
}
