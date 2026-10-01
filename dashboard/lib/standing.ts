export const WORKING = "Working";
export const WAITING = "Needs input";
export const DONE = "Finished";

const STANDINGS = [WORKING, WAITING, DONE] as const;

export type Standing = (typeof STANDINGS)[number];

const DECLARED = [WAITING, DONE] as const;

const mark = (standing: Standing) => `[${standing.toLowerCase()}]`;

const MARK = new RegExp(`\\n*^\\[(${DECLARED.map((one) => one.toLowerCase()).join("|")})\\]\\s*$`, "im");

export const declared = (body: string): { body: string; standing?: Standing } => {
  const found = body.match(MARK);
  if (!found) return { body };
  const said = found[1].toLowerCase();
  const standing = DECLARED.find((one) => one.toLowerCase() === said);
  return { body: body.replace(MARK, "").trim(), standing };
};

export const CLOSING =
  `The user reads one message per turn: your last. Everything you say before it is folded away as ` +
  `a step, so keep each of those to one short line. The last message stands alone and always ` +
  `opens the same way, with one sentence: what you need from them, when you are waiting on an ` +
  `answer before the work can go on, otherwise what the work came to. Under it goes only what is ` +
  `left for them to do or decide, one line each, and never how you got there. End that message ` +
  `with its state on its own last line: ${mark(WAITING)} when you are waiting, ${mark(DONE)} ` +
  `otherwise. The mark is stripped before the message is shown.`;
