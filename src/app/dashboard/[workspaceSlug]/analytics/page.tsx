import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { getWorkspaceAnalytics } from "@/actions/analytics";
import { KPICards } from "@/components/analytics/kpi-cards";
import { TimeSeries } from "@/components/analytics/time-series";
import { BreakdownTables } from "@/components/analytics/breakdown-tables";
import { redirect } from "next/navigation";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ tf?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { tf } = await searchParams;
  const timeframe = tf || "7d";

  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const workspaces = await getWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
  if (!currentWorkspace) redirect("/auth");

  const analyticsData = await getWorkspaceAnalytics(
    currentWorkspace.id,
    timeframe
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Insights</h2>
          <p className="text-muted-foreground text-xs">
            Realtime visitor telemetry and interaction metrics.
          </p>
        </div>

        <div className="border-border bg-card flex gap-1 rounded-lg border p-1 text-xs font-medium">
          <a
            href="?tf=24h"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              timeframe === "24h"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            24h
          </a>
          <a
            href="?tf=7d"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              timeframe === "7d"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            7d
          </a>
          <a
            href="?tf=30d"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              timeframe === "30d"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            30d
          </a>
        </div>
      </div>

      <KPICards
        totalClicks={analyticsData.kpi.totalClicks}
        uniqueClicks={analyticsData.kpi.uniqueClicks}
        topLink={analyticsData.kpi.topLink}
      />

      <TimeSeries data={analyticsData.timeSeries} />

      <BreakdownTables
        countries={analyticsData.countries}
        referrers={analyticsData.referrers}
        devices={analyticsData.devices}
      />
    </div>
  );
}
