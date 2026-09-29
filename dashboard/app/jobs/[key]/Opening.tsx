import { CircleAlert } from "lucide-react";
import Actions from "@/components/Actions";
import CopyKey from "./CopyKey";
import Glyph from "@/components/Glyph";
import { Badge, fitTone } from "@/components/Status";
import { Back, Out, Sheet, Stack } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { actionsFor } from "@/lib/actions";
import type { Prospect } from "@/lib/queries";

const Read = ({ posting }: { posting: Prospect["posting"] }) => (
  <div className="min-w-0">
    <h1 className="font-display text-2xl font-medium leading-tight md:text-3xl">{posting.title}</h1>
    <p className="mt-1 text-sm font-medium">{posting.company}</p>
  </div>
);

const Judged = ({ posting }: { posting: Prospect["posting"] }) => (
  <p className="mt-3 text-sm leading-6 text-soft">
    <span className="mr-3 border-r border-base-300 pr-3">
      <Badge>{posting.status}</Badge>
    </span>
    <span className={`tnum mr-2 font-display text-base ${fitTone(posting.score)}`}>{posting.score ?? "—"}</span>
    {posting.reason}
  </p>
);

const Blocked = ({ on }: { on: string }) => (
  <p className="mt-3 flex items-start gap-2 rounded-field border border-error/40 px-2.5 py-1.5 text-xs text-error">
    <Glyph icon={CircleAlert} className="mt-px" />
    <span className="min-w-0">Blocked on {on}</span>
  </p>
);

export default function Opening({ found }: { found: Prospect }) {
  const { posting, staged } = found;
  const { other } = actionsFor(posting.status);

  return (
    <header className="mb-6">
      <Back href="/jobs">All jobs</Back>

      <Stack className="@container">
        <div className="grid @4xl:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="min-w-0 p-4 md:p-5">
            <Read posting={posting} />
            <Judged posting={posting} />
            {staged?.blocked_on && <Blocked on={staged.blocked_on} />}
          </div>

          <div className="border-t border-base-300 @4xl:border-l @4xl:border-t-0">
            <Sheet
              flush
              label="7rem"
              notes={[
                { label: "Location", value: posting.location || (posting.remote ? "Remote" : "—") },
                { label: "Compensation", value: posting.compensation || "—" },
                { label: "Posted", value: shortDate(posting.posted_at) },
                { label: "Posting", value: <Out href={posting.url}>{posting.source || "open"}</Out> },
              ]}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-base-300
          px-4 py-2.5 md:px-5"
        >
          <Actions ids={other} argument={posting.key} />
          <span className="ml-auto">
            <CopyKey jobKey={posting.key} />
          </span>
        </div>
      </Stack>
    </header>
  );
}
