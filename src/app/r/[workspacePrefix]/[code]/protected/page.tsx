import { db } from "@/lib/db";
import { links, workspaces } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PasswordForm } from "./password-form";
import { generateUnlockSignature } from "@/actions/links-security";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workspacePrefix: string; code: string }>;
}

export default async function ProtectedPage({ params }: PageProps) {
  const { workspacePrefix, code } = await params;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.shortPrefix, workspacePrefix))
    .limit(1);

  if (!workspace) {
    redirect("/expired");
  }

  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.shortCode, code)))
    .limit(1);

  if (!link || !link.isActive || !link.password) {
    redirect("/expired");
  }

  if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
    redirect("/expired");
  }

  if (link.maxClicks && link.clicksCount >= link.maxClicks) {
    redirect("/expired");
  }

  const cookieStore = await cookies();
  const unlockedCookie = cookieStore.get(
    `link_unlocked_${workspacePrefix}_${code}`
  )?.value;

  const expectedSignature = await generateUnlockSignature(
    workspacePrefix,
    code
  );

  const isUnlocked = unlockedCookie === expectedSignature;

  if (isUnlocked) {
    redirect(`/r/${workspacePrefix}/${code}`);
  }

  return (
    <div className="from-background via-muted/30 to-background flex min-h-screen flex-col items-center justify-center p-4">
      <PasswordForm
        workspacePrefix={workspacePrefix}
        code={code}
        title={link.title || "Secure Link"}
      />
    </div>
  );
}
