import * as React from "react";

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-muted/70 h-7 w-48 rounded-lg" />
          <div className="bg-muted/40 h-4 w-72 rounded-lg" />
        </div>
        <div className="bg-muted/60 h-9 w-28 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border/40 bg-card flex items-center gap-4 rounded-xl border p-5"
          >
            <div className="bg-muted/70 size-11 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted/50 h-3 w-1/3 rounded-sm" />
              <div className="bg-muted/80 h-6 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-border/40 bg-card space-y-4 rounded-xl border p-5">
        <div className="bg-muted/70 h-4 w-36 rounded-md" />
        <div className="bg-muted/30 h-48 w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border/40 bg-card space-y-3 rounded-xl border p-5"
          >
            <div className="bg-muted/70 h-4 w-28 rounded-md" />
            <div className="space-y-2">
              <div className="bg-muted/30 h-3 w-full rounded-sm" />
              <div className="bg-muted/30 h-3 w-5/6 rounded-sm" />
              <div className="bg-muted/30 h-3 w-4/6 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
