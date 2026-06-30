import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { getBillingInfo } from "@/actions/billing";
import { BillingUpgradeButton } from "@/components/billing-upgrade-button";
import { Sparkles, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quota & Billing</h2>
        <p className="text-muted-foreground text-xs">
          Check resource limits, usage boundaries, and active plan metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-card border-border space-y-4 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h3 className="text-sm font-semibold">Active Workspace Plan</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Current Membership Tier
              </span>
              <span className="font-bold capitalize">{billing.plan}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Capacity Limitation</span>
              <span className="font-bold">
                {billing.linkLimit === 10 ? "10 Links" : "Unlimited Links"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border-border relative space-y-4 overflow-hidden rounded-xl border p-5">
          <div className="bg-primary/10 text-primary absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-[10px] font-bold">
            MOST POPULAR
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-5" />
            <h3 className="text-sm font-semibold">Upgrade to Premium</h3>
          </div>
          <p className="text-muted-foreground text-xs">
            Get limitless redirections, deep country-specific device analysis,
            custom metadata modifications.
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">$29</span>
            <span className="text-muted-foreground text-xs">/ month</span>
          </div>
          <BillingUpgradeButton
            workspaceId={currentWorkspace.id}
            currentPlan={billing.plan}
          />
        </div>
      </div>
    </div>
  );
}
