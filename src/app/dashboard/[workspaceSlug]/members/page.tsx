import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace-crud";
import { getWorkspaceMembers } from "@/actions/workspace-members";
import { TeamMembers } from "@/components/team-members";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

interface FormattedMember {
  id: string;
  role: "owner" | "admin" | "viewer";
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const workspacesList = await getWorkspaces();
  const currentWorkspace = workspacesList.find((w) => w.slug === workspaceSlug);
  if (!currentWorkspace) redirect("/auth");

  const [userMemberRecord] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, currentWorkspace.id),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!userMemberRecord) redirect("/auth");
  const members = await getWorkspaceMembers(currentWorkspace.id);

  const formattedMembers: FormattedMember[] = members.map((m) => ({
    id: m.id,
    role: m.role as "owner" | "admin" | "viewer",
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Team Configuration
        </h2>
        <p className="text-muted-foreground text-xs">
          Manage your workspace access controls and invitations.
        </p>
      </div>

      <TeamMembers
        workspaceId={currentWorkspace.id}
        initialMembers={formattedMembers}
        currentUserRole={userMemberRecord.role as "owner" | "admin" | "viewer"}
      />
    </div>
  );
}
