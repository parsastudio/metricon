"use client";

import { BarChart3, Users, Award } from "lucide-react";

interface KPICardsProps {
  totalClicks: number;
  uniqueClicks: number;
  topLink: string;
}

export function KPICards({
  totalClicks,
  uniqueClicks,
  topLink,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-5">
        <div className="bg-primary/10 text-primary rounded-lg p-3">
          <BarChart3 className="size-5" />
        </div>
        <div>
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Total Click Event
          </span>
          <h4 className="text-2xl font-bold tracking-tight">
            {totalClicks.toLocaleString()}
          </h4>
        </div>
      </div>

      <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-5">
        <div className="bg-primary/10 text-primary rounded-lg p-3">
          <Users className="size-5" />
        </div>
        <div>
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Unique Visitors
          </span>
          <h4 className="text-2xl font-bold tracking-tight">
            {uniqueClicks.toLocaleString()}
          </h4>
        </div>
      </div>

      <div className="bg-card border-border flex items-center gap-4 rounded-xl border p-5">
        <div className="bg-primary/10 text-primary rounded-lg p-3">
          <Award className="size-5" />
        </div>
        <div className="min-w-0">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Best Performer
          </span>
          <h4 className="truncate text-lg font-bold tracking-tight">
            {topLink}
          </h4>
        </div>
      </div>
    </div>
  );
}
