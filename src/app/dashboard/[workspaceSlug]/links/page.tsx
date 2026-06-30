import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { getLinks } from "@/actions/links";
import { LinkCreator } from "@/components/link-creator";
import { LinksTable } from "@/components/links-table";
import { Layers } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LinksPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const workspaces = await getWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
  if (!currentWorkspace) redirect("/auth");

  const linksList = await getLinks(currentWorkspace.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspace Links</h2>
          <p className="text-muted-foreground text-xs">
            Manage your tracking, targeting & shortened codes.
          </p>
        </div>
        <LinkCreator
          workspaceId={currentWorkspace.id}
          isPro={currentWorkspace.plan === "pro"}
        />
      </div>

      {linksList.length === 0 ? (
        <div className="bg-card border-border space-y-3 rounded-xl border p-12 text-center">
          <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
            <Layers className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">No links created</h3>
            <p className="text-muted-foreground text-xs">
              Create your first intelligent campaign tracking link today.
            </p>
          </div>
        </div>
      ) : (
        <LinksTable
          workspaceId={currentWorkspace.id}
          initialLinks={linksList}
        />
      )}
    </div>
  );
}
