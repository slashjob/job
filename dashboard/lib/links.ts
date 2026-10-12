export const jobHref = (key: string) => `/jobs/${encodeURIComponent(key)}`;

export const assetHref = (kind: string, key: string) => `/asset/${kind}/${encodeURIComponent(key)}`;

export const newsHref = "/news";

export const contactsHref = "/contacts";

export type Lead = "jobs" | "news";

export const companyAnchor = (lead: Lead, company: string) => `${lead}-${company}`;

export const companyHref = (lead: Lead, company: string) =>
  `${contactsHref}#${encodeURIComponent(companyAnchor(lead, company))}`;

export const careerHref = "/profile/career";

export const employerHref = (employer: number) => `${careerHref}/${employer}`;

export const projectHref = (employer: number, project: number) => `${employerHref(employer)}/${project}`;

export const educationHref = "/profile/education";

export const degreeHref = (degree: number) => `${educationHref}/${degree}`;
