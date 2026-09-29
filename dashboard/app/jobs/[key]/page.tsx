import Actions from "@/components/Actions";
import Opening from "./Opening";
import { held } from "./held";
import { Card, Out, Prose, Stack, Stamp } from "@/components/ui";
import { actionsFor } from "@/lib/actions";
import { assetHref } from "@/lib/links";
import type { Posting } from "@/lib/queries";

export const dynamic = "force-dynamic";

const FITTED = "#toolbar=0&navpanes=0&view=FitH";

const BAND = `flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1
  border-base-300 px-3 py-2 md:border-b`;

const Description = ({ posting }: { posting: Posting }) => (
  <Card className="reader md:overflow-auto">
    {posting.description ? (
      <Prose>{posting.description}</Prose>
    ) : (
      <p className="text-sm text-soft">
        No description was captured for this posting. <Out href={posting.url}>Read it on {posting.source}</Out>.
      </p>
    )}
  </Card>
);

const Resume = ({ posting }: { posting: Posting }) => {
  const file = assetHref("resume", posting.key);
  const { resume: build } = actionsFor(posting.status);

  return (
    <Stack className={`flex flex-col ${posting.resume ? "reader" : "xl:reader"}`}>
      <div className={BAND}>
        {posting.resume ? (
          <Stamp>{posting.resume.split("/").pop()}</Stamp>
        ) : (
          <span className="text-sm text-soft">No resume built for this opening yet.</span>
        )}

        <span className="flex items-center gap-3">
          {posting.resume && (
            <span className="text-sm">
              <Out href={file}>Open the PDF</Out>
            </span>
          )}
          <Actions ids={build} argument={posting.key} />
        </span>
      </div>

      {posting.resume && (
        <iframe
          src={`${file}${FITTED}`}
          title={`Resume tailored for ${posting.company}`}
          className="min-h-0 w-full flex-1 bg-white max-md:hidden"
        />
      )}
    </Stack>
  );
};

export default async function JobPage({ params }: PageProps<"/jobs/[key]">) {
  const found = await held(params);
  const { posting } = found;

  return (
    <>
      <Opening found={found} />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Description posting={posting} />
        <Resume posting={posting} />
      </div>
    </>
  );
}
