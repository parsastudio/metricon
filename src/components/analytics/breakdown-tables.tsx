"use client";

import { Globe, HardDrive, Compass } from "lucide-react";

interface RecordRow {
  name: string;
  value: number;
}

interface BreakdownTablesProps {
  countries: RecordRow[];
  referrers: RecordRow[];
  devices: RecordRow[];
}

export function BreakdownTables({
  countries,
  referrers,
  devices,
}: BreakdownTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="bg-card border-border space-y-3 rounded-xl border p-5">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Globe className="text-primary size-4" />
          <span>Top Countries</span>
        </div>
        <div className="h-44 space-y-2 overflow-y-auto pr-1">
          {countries.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Empty
            </div>
          ) : (
            countries.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium">{item.name}</span>
                <span className="bg-muted rounded px-1.5 py-0.5 font-mono">
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card border-border space-y-3 rounded-xl border p-5">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Compass className="text-primary size-4" />
          <span>Referrers</span>
        </div>
        <div className="h-44 space-y-2 overflow-y-auto pr-1">
          {referrers.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Empty
            </div>
          ) : (
            referrers.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="max-w-[150px] truncate font-medium">
                  {item.name}
                </span>
                <span className="bg-muted rounded px-1.5 py-0.5 font-mono">
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card border-border space-y-3 rounded-xl border p-5">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <HardDrive className="text-primary size-4" />
          <span>Devices Used</span>
        </div>
        <div className="h-44 space-y-2 overflow-y-auto pr-1">
          {devices.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Empty
            </div>
          ) : (
            devices.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium">{item.name}</span>
                <span className="bg-muted rounded px-1.5 py-0.5 font-mono">
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
