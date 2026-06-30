import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }

  const workspaces = await getWorkspaces();
  if (workspaces.length > 0) {
    redirect(`/dashboard/${workspaces[0].slug}`);
  }

  redirect("/auth");
}
