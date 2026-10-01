export const jobHref = (key: string) => `/jobs/${encodeURIComponent(key)}`;

export const assetHref = (kind: string, key: string) => `/asset/${kind}/${encodeURIComponent(key)}`;

export const networkHref = "/network";

export const companyHref = (company: string) => `${networkHref}#${encodeURIComponent(company)}`;

export const careerHref = "/profile/career";

export const employerHref = (employer: number) => `${careerHref}/${employer}`;

export const projectHref = (employer: number, project: number) => `${employerHref(employer)}/${project}`;

export const educationHref = "/profile/education";

export const degreeHref = (degree: number) => `${educationHref}/${degree}`;
