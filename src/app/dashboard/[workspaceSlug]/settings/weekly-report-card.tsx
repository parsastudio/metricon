"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, ShieldAlert } from "lucide-react";
import { sendWeeklyWorkspaceReport } from "@/actions/workspace-reports";
import { toast } from "sonner";

interface WeeklyReportTriggerProps {
  workspaceId: string;
  isOwner: boolean;
}

export function WeeklyReportTrigger({
  workspaceId,
  isOwner,
}: WeeklyReportTriggerProps) {
  const [loading, setLoading] = React.useState(false);

  const handleTrigger = async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const res = await sendWeeklyWorkspaceReport(workspaceId);
      if (res.success) {
        toast.success("Weekly analytics digest dispatch initialized!");
      } else {
        toast.error("Failed to generate performance report digest.");
      }
    } catch {
      toast.error("An error occurred during digest processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <Mail className="size-5" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Performance Email Digests
            </h3>
            <p className="text-muted-foreground text-xs">
              Configure and test automated weekly HTML analytics reports
              dispatched straight to team owners.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/40 border-border/60 rounded-lg border p-4">
        <h4 className="text-foreground flex items-center gap-1.5 text-xs font-bold">
          <Sparkles className="text-primary size-4" /> Direct Sandbox Test
          Trigger
        </h4>
        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
          Simulate a weekly cron-job action. This will calculate the last 7 days
          of campaign clicks, geolocations, and devices to dispatch a luxurious
          HTML email report to all workspace owners.
        </p>

        <div className="mt-4 flex justify-end">
          {isOwner ? (
            <Button
              onClick={handleTrigger}
              disabled={loading}
              className="cursor-pointer gap-2"
              size="sm"
            >
              {loading ? "Generating Report..." : "Dispatch Weekly Report Now"}
            </Button>
          ) : (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <ShieldAlert className="size-4" />
              Only workspace owners can trigger email digests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
