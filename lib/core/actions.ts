export type Action = {
  id: string;
  does: string;
  argument: string;
};

export const ACTIONS: Action[] = [
  {
    id: "install",
    does: "Install what the skill needs",
    argument: "",
  },
  {
    id: "setup",
    does: "Build your profile",
    argument: "",
  },
  {
    id: "search",
    does: "Find companies in the news building what you have built, their openings, and who to write to",
    argument: "[project]",
  },
  {
    id: "resume",
    does: "Tailor a resume for a job, or for every job without one",
    argument: "[JD, URL, or key]",
  },
  {
    id: "apply",
    does: "Fill out the application for one job, for you to submit",
    argument: "<key or URL>",
  },
  {
    id: "contact",
    does: "Write to someone at a company, about it or one of its jobs",
    argument: "[key or company]",
  },
  {
    id: "dashboard",
    does: "Start the local dashboard and open its tab, or stop it",
    argument: "[start|stop|status]",
  },
];
