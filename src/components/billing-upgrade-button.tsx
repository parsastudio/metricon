"use client";

import * as React from "react";
import { upgradeToPro, createPortalSession } from "@/actions/billing";
import { toast } from "sonner";

interface BillingUpgradeButtonProps {
  workspaceId: string;
  currentPlan: "free" | "pro";
}

export function BillingUpgradeButton({
  workspaceId,
  currentPlan,
}: BillingUpgradeButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (currentPlan === "pro") {
        const res = await createPortalSession(workspaceId);
        if (res.success && res.url) {
          window.location.href = res.url;
        } else {
          toast.error("Failed to load customer portal.");
        }
      } else {
        const res = await upgradeToPro(workspaceId);
        if (res.success && res.url) {
          window.location.href = res.url;
        } else {
          toast.error("Failed to initialize checkout.");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className="bg-primary text-primary-foreground hover:bg-primary/90 w-full cursor-pointer rounded-lg py-2 text-xs font-bold transition-colors disabled:opacity-50"
    >
      {loading
        ? "Processing..."
        : currentPlan === "pro"
          ? "Manage Subscription"
          : "Get Pro Access"}
    </button>
  );
}
