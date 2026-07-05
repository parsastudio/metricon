import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { getBillingInfo } from "@/actions/billing";
import { BillingUpgradeButton } from "@/components/billing-upgrade-button";
import {
  Sparkles,
  CreditCard,
  Activity,
  ShieldCheck,
  Info,
} from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { links } from "@/lib/schema";
import { count, eq } from "drizzle-orm";

export default async function BillingPage({
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

  const billing = await getBillingInfo(currentWorkspace.id);

  const [linksCountResult] = await db
    .select({ value: count() })
    .from(links)
    .where(eq(links.workspaceId, currentWorkspace.id));
  const linksCount = linksCountResult?.value || 0;

  const isPro = billing.plan === "pro";
  const limit = billing.linkLimit;
  const percentage = isPro ? 0 : Math.min((linksCount / limit) * 100, 100);

  const isCloseToLimit = !isPro && percentage >= 80;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quota & Billing</h2>
        <p className="text-muted-foreground text-xs">
          Check resource limits, usage boundaries, and active plan metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-card border-border flex flex-col justify-between rounded-xl border p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-primary size-5" />
                <h3 className="text-sm font-semibold">Active Workspace Plan</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Current Membership Tier
                  </span>
                  <span className="font-bold capitalize">{billing.plan}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Capacity Limitation
                  </span>
                  <span className="font-bold">
                    {isPro ? "Unlimited Links" : "10 Active Links"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border-border rounded-xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="text-primary size-5" />
              <h3 className="text-sm font-semibold">Workspace Utilization</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Active Redirect Codes Mapped
                </span>
                <span className="font-mono font-bold">
                  {linksCount} / {isPro ? "∞" : limit}
                </span>
              </div>

              {!isPro ? (
                <div className="space-y-2">
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 90
                          ? "bg-destructive"
                          : percentage >= 75
                            ? "bg-amber-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isCloseToLimit && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[10px] leading-relaxed text-amber-500">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        You are reaching the limits of your free organizational
                        plan. Upgrade to the Pro plan to secure continuous
                        redirect capabilities.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-[10px] text-emerald-500">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>
                    Your Pro subscription guarantees unlimited short codes and
                    vanity domain prefixes.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border-border relative flex flex-col justify-between overflow-hidden rounded-xl border p-5 shadow-sm">
          <div className="bg-primary/10 text-primary absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-[10px] font-bold">
            MOST POPULAR
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-5" />
              <h3 className="text-sm font-semibold">Upgrade to Premium</h3>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Get limitless redirections, deep country-specific device analysis,
              custom metadata modifications.
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">$29</span>
              <span className="text-muted-foreground text-xs">/ month</span>
            </div>
          </div>
          <div className="pt-4">
            <BillingUpgradeButton
              workspaceId={currentWorkspace.id}
              currentPlan={billing.plan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
