"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  data: {
    kpi: { totalClicks: number; uniqueClicks: number; topLink: string };
    countries: { name: string; value: number }[];
    referrers: { name: string; value: number }[];
    devices: { name: string; value: number }[];
    timeSeries: { date: string; clicks: number }[];
  };
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    try {
      const rows = [
        ["Metricon Analytics Report"],
        ["Generated At", new Date().toISOString()],
        [],
        ["KPI Metrics"],
        ["Total Clicks", data.kpi.totalClicks],
        ["Unique Clicks", data.kpi.uniqueClicks],
        ["Top Performing Link", data.kpi.topLink],
        [],
        ["Time-Series Click History"],
        ["Date", "Clicks Count"],
        ...data.timeSeries.map((t) => [t.date, t.clicks]),
        [],
        ["Country Distribution"],
        ["Country Code", "Clicks"],
        ...data.countries.map((c) => [c.name, c.value]),
        [],
        ["Traffic Referrers"],
        ["Referrer Source", "Clicks"],
        ...data.referrers.map((r) => [r.name, r.value]),
        [],
        ["Device Breakdown"],
        ["Device Type", "Clicks"],
        ...data.devices.map((d) => [d.name, d.value]),
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows
          .map((e) =>
            e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
          )
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `metricon_analytics_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Analytics data exported successfully as CSV");
    } catch {
      toast.error("Failed to export analytics data");
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="border-border/60 hover:bg-muted cursor-pointer gap-2"
    >
      <Download className="size-3.5" />
      Export CSV
    </Button>
  );
}
