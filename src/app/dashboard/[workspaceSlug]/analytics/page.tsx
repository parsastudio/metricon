import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { getWorkspaceAnalytics } from "@/actions/analytics";
import { KPICards } from "@/components/analytics/kpi-cards";
import { TimeSeries } from "@/components/analytics/time-series";
import { BreakdownTables } from "@/components/analytics/breakdown-tables";
import { ExportButton } from "@/components/analytics/export-button";
import { SeedButton } from "@/components/analytics/seed-button";
import { BarChart3 } from "lucide-react";
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

  const hasData = analyticsData.kpi.totalClicks > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Insights</h2>
          <p className="text-muted-foreground text-xs">
            Realtime visitor telemetry and interaction metrics.
          </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-2">
            <ExportButton data={analyticsData} />

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
        )}
      </div>

      {!hasData ? (
        <div className="bg-card border-border space-y-4 rounded-xl border p-12 text-center">
          <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
            <BarChart3 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">
              Analytics Workspace is Empty
            </h3>
            <p className="text-muted-foreground mx-auto mb-4 max-w-sm text-xs leading-relaxed">
              We cannot render live insights until links have been registered
              and visited. Inject dynamic tracking telemetry instantly.
            </p>
          </div>
          <div className="flex justify-center">
            <SeedButton workspaceId={currentWorkspace.id} />
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
