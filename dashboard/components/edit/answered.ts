import { say } from "@/components/Toaster";

export const answered = async <T>(write: Promise<T>): Promise<T | { error: string }> => {
  try {
    return await write;
  } catch {
    return { error: "the server never answered — reload the page, then try again" };
  }
};

export function reported<T>(result: T | { error: string }): result is { error: string } {
  if (result && typeof result === "object" && "error" in result) {
    say(result.error, true);
    return true;
  }
  return false;
}
