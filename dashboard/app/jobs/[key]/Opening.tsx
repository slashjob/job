import Actions from "@/components/Actions";
import CopyKey from "./CopyKey";
import { Back, Out, Sheet, Stack } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { companyHref } from "@/lib/links";
import type { Posting } from "@/lib/queries";

const Read = ({ posting }: { posting: Posting }) => (
  <div className="min-w-0">
    <h1 className="font-display text-2xl font-medium leading-tight md:text-3xl">{posting.title}</h1>
    <p className="mt-1 text-sm font-medium">{posting.company}</p>
  </div>
);

export default function Opening({ posting }: { posting: Posting }) {
  return (
    <header className="mb-6">
      <Back href={companyHref(posting.company_id)}>{posting.company}</Back>

      <Stack className="@container">
        <div className="grid @4xl:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="min-w-0 p-4 md:p-5">
            <Read posting={posting} />
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
          <Actions ids={["apply", "contact"]} argument={posting.key} />
          <span className="ml-auto">
            <CopyKey jobKey={posting.key} />
          </span>
        </div>
      </Stack>
    </header>
  );
}
