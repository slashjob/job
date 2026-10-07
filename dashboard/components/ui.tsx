import Link from "next/link";
import type { CSSProperties, ComponentPropsWithRef, ReactNode, Ref } from "react";
import { ChevronLeft } from "lucide-react";
import Glyph from "@/components/Glyph";

export const Measure = ({
  children,
  className = "",
  ref,
}: {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) => (
  <div ref={ref} className={`mx-auto max-w-4xl ${className}`}>
    {children}
  </div>
);

export const Card = ({
  children,
  soft,
  tight,
  className = "",
}: {
  children: ReactNode;
  soft?: boolean;
  tight?: boolean;
  className?: string;
}) => (
  <div
    className={`rounded-box bg-base-100 ${soft ? "" : "border border-base-300"}
      ${tight ? "p-1.5" : "p-4 md:p-5"} ${className}`}
  >
    {children}
  </div>
);

export const Heading = ({ className = "", children }: { className?: string; children: ReactNode }) => (
  <h2 className={`mb-3 flex items-center gap-2 font-display text-base font-semibold ${className}`}>{children}</h2>
);

export const Count = ({ of }: { of: number }) => <span className="tnum text-sm font-normal text-soft">{of}</span>;

export const Back = ({ href, children }: { href: string; children: ReactNode }) => (
  <GhostLink href={href} className="-ml-2 mb-1 text-sm" icon={<Glyph icon={ChevronLeft} />}>
    {children}
  </GhostLink>
);

const TONES = {
  quiet: "border border-base-300 hover:border-base-content disabled:hover:border-base-300",
  firm: `border border-base-content bg-base-content text-base-100
    hover:border-base-content/85 hover:bg-base-content/85`,
  grave: "border border-error/40 text-error hover:border-error hover:bg-error hover:text-error-content",
};

export const Button = ({
  tone = "quiet",
  icon,
  roomy,
  on,
  children,
  className = "",
  ...rest
}: {
  tone?: "quiet" | "firm" | "grave";
  icon?: ReactNode;
  roomy?: boolean;
  on?: boolean;
} & ComponentPropsWithRef<"button">) => (
  <button
    type="button"
    {...rest}
    className={`hit inline-flex items-center justify-center gap-1.5 rounded-field transition-colors
      disabled:opacity-40
      ${roomy ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}
      ${TONES[tone]} ${on ? "border-base-content" : ""} ${className}`}
  >
    {icon}
    {children}
  </button>
);

export const Divider = () => <span aria-hidden className="h-4 w-px shrink-0 bg-base-300 max-sm:hidden" />;

export const NavGroup = ({ children, fill }: { children: ReactNode; fill?: boolean }) => (
  <ul className={`flex items-center gap-0.5 sm:gap-1 ${fill ? "strip min-w-0 flex-1" : "shrink-0"}`}>{children}</ul>
);

const GHOST_TONES = {
  quiet: "text-soft hover:bg-base-200 hover:text-base-content",
  grave: "text-error hover:bg-error hover:text-error-content",
};

const ghost = ({
  tone = "quiet",
  tight,
  on,
  className = "",
}: {
  tone?: keyof typeof GHOST_TONES;
  tight?: boolean;
  on?: boolean;
  className?: string;
}) =>
  `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-field transition-colors disabled:opacity-40
    ${tight ? "px-1 leading-none" : "hit p-1.5"}
    ${on ? "bg-base-200 font-medium text-base-content" : GHOST_TONES[tone]} ${className}`;

export const Ghost = ({
  icon,
  tone,
  tight,
  on,
  children,
  className = "",
  ...rest
}: {
  icon?: ReactNode;
  tone?: keyof typeof GHOST_TONES;
  tight?: boolean;
  on?: boolean;
} & ComponentPropsWithRef<"button">) => (
  <button type="button" {...rest} className={ghost({ tone, tight, on, className })}>
    {icon}
    {children}
  </button>
);

export const GhostLink = ({
  href,
  icon,
  on,
  children,
  className = "",
  ...rest
}: { href: string; icon?: ReactNode; on?: boolean } & Omit<ComponentPropsWithRef<typeof Link>, "href">) => (
  <Link href={href} {...rest} className={ghost({ on, className })}>
    {icon}
    {children}
  </Link>
);

const ROW_TONES = {
  quiet: "hover:bg-base-200",
  grave: "text-error hover:bg-error hover:text-error-content",
};

export const Row = ({
  tone = "quiet",
  roomy,
  on,
  children,
  className = "",
  ...rest
}: {
  tone?: "quiet" | "grave";
  roomy?: boolean;
  on?: boolean;
} & ComponentPropsWithRef<"button">) => (
  <button
    type="button"
    {...rest}
    className={`hit w-full rounded-field text-left transition-colors disabled:opacity-40
      ${roomy ? "px-3 py-2 text-sm" : "px-3 py-1.5 text-xs"}
      ${ROW_TONES[tone]} ${on ? "bg-base-200" : ""} ${className}`}
  >
    {children}
  </button>
);

export const SearchField = ({
  icon,
  className = "",
  ...rest
}: { icon: ReactNode } & Omit<ComponentPropsWithRef<"input">, "type">) => (
  <label className={`relative flex items-center ${className}`}>
    <span className="pointer-events-none absolute left-2.5 text-soft">{icon}</span>
    <input type="search" {...rest} className="field hit py-1.5 pl-8 text-sm" />
  </label>
);

export const TextField = (props: Omit<ComponentPropsWithRef<"input">, "type" | "className">) => (
  <input type="text" {...props} className="field hit py-1.5 text-xs" />
);

export const confirmDelete = (what: string) => confirm(`Delete ${what}? This cannot be undone.`);

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="px-3 py-2.5 text-sm text-soft">{children}</p>
);

export const Invite = ({ heading, detail, children }: { heading: string; detail: string; children: ReactNode }) => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-12 text-center">
    <h2 className="font-display text-base font-semibold">{heading}</h2>
    <p className="mb-3 text-sm text-soft">{detail}</p>
    {children}
  </div>
);

export const Prose = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${className}`}>{children}</div>
);

const DOT_TONES = {
  signal: "bg-signal",
  mark: "bg-mark",
  current: "bg-current",
  none: "bg-transparent",
};

export const Dot = ({
  tone = "signal",
  blink,
  delay,
}: {
  tone?: keyof typeof DOT_TONES;
  blink?: boolean;
  delay?: number;
}) => (
  <span
    aria-hidden
    style={delay ? { animationDelay: `${delay}ms` } : undefined}
    className={`inline-block size-1.5 shrink-0 rounded-full ${DOT_TONES[tone]} ${blink ? "animate-blink" : ""}`}
  />
);

const CARET_TONES = {
  mark: "bg-mark",
  rest: "bg-base-300",
};

export const Caret = ({ tone = "mark", blink }: { tone?: keyof typeof CARET_TONES; blink?: boolean }) => (
  <span
    aria-hidden
    className={`inline-block h-[0.95em] w-[0.5em] shrink-0 rounded-[0.12em] ${CARET_TONES[tone]}
      ${blink ? "animate-blink" : ""}`}
  />
);

export const Flag = ({ children }: { children: ReactNode }) => (
  <span className="tnum inline-flex items-center rounded-selector bg-mark px-1.5 py-px text-micro font-semibold text-mark-content">
    {children}
  </span>
);

export const Tip = ({ tip, children }: { tip: string; children: ReactNode }) => (
  <span data-tip={tip} className="tooltip tooltip-bottom tooltip-loose before:text-micro [&:before]:text-left">
    {children}
  </span>
);

export const Stamp = ({ children }: { children: ReactNode }) => (
  <span className="tnum whitespace-nowrap text-xs text-soft">{children}</span>
);

export const Out = ({ href, children }: { href: string | null; children?: ReactNode }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" className="link">
      {children ?? href}
    </a>
  ) : (
    <span className="text-soft">—</span>
  );

export type Note = { label: ReactNode; value: ReactNode; mark?: boolean };

export const Sheet = ({
  title,
  notes,
  flush,
  label,
  children,
}: {
  title?: string;
  notes?: (Note | false | null | undefined)[];
  flush?: boolean;
  label?: string;
  children?: ReactNode;
}) => {
  const kept = (notes ?? []).filter((note): note is Note => Boolean(note));
  const marked = kept.some((note) => note.mark !== undefined);
  return (
    <section
      style={label ? ({ "--label": label } as CSSProperties) : undefined}
      className={flush ? "" : "rounded-box bg-base-100 p-2"}
    >
      {title && <h3 className="eyebrow px-3 pb-1 pt-2">{title}</h3>}
      <dl className={flush ? "divide-y divide-rule" : ""}>
        {kept.map((note, index) => (
          <div key={index} className={`sheetrow px-3 ${flush ? "py-1.5" : "py-1"}`}>
            <dt className="flex items-baseline gap-1.5 py-1 text-sm text-soft">
              {marked && (
                <span className="self-center">
                  <Dot tone={note.mark ? "signal" : "none"} />
                </span>
              )}
              <span className="min-w-0">{note.label}</span>
            </dt>
            <dd className="min-w-0 break-words py-1 text-sm">{note.value}</dd>
          </div>
        ))}
      </dl>
      {children && <div className="px-3 py-1 text-sm">{children}</div>}
    </section>
  );
};

export const Stack = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-box border border-base-300 bg-base-100 ${className}`}>{children}</div>
);
