import Employers from "./career/Employers";
import { Identity, Instructions, Summary } from "./sections";
import Degrees from "./education/Degrees";
import { career, education } from "@/lib/queries";
import type { ReactNode } from "react";
import { Group } from "@/components/ui";
import { BriefcaseBusiness, GraduationCap, IdCard, NotebookPen, type LucideIcon } from "lucide-react";

type Panel = {
  tab: string;
  covers?: string[];
  icon: LucideIcon;
  body: () => ReactNode;
};

export const PANELS: Record<string, Panel> = {
  identity: {
    tab: "Identity",
    icon: IdCard,
    body: () => <Identity />,
  },

  career: {
    tab: "Work history",
    covers: ["career", "experience"],
    icon: BriefcaseBusiness,
    body: () => {
      const employers = career();
      return (
        <>
          <Summary />
          <Group heading="Employers" count={employers.length}>
            <Employers employers={employers} />
          </Group>
        </>
      );
    },
  },
  education: {
    tab: "Education",
    icon: GraduationCap,
    body: () => <Degrees degrees={education()} />,
  },

  instructions: {
    tab: "Instructions",
    icon: NotebookPen,
    body: () => <Instructions />,
  },
};

export const slugFor = (section: string) =>
  Object.entries(PANELS).find(([slug, panel]) => (panel.covers ?? [slug]).includes(section))?.[0] ?? section;
