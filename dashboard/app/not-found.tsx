import { Invite, GhostLink } from "@/components/ui";

export default function NotFound() {
  return (
    <Invite heading="Nothing here" detail="This page does not exist.">
      <GhostLink href="/jobs">Go to jobs</GhostLink>
    </Invite>
  );
}
