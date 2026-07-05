"use client";

import { Globe, HardDrive, Compass } from "lucide-react";
import { DeviceDonut } from "./device-donut";

interface RecordRow {
  name: string;
  value: number;
}

interface BreakdownTablesProps {
  countries: RecordRow[];
  referrers: RecordRow[];
  devices: RecordRow[];
}

function getUnicodeFlag(countryCode: string): string {
  if (!countryCode || countryCode === "Unknown") return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
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
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="text-sm select-none"
                    role="img"
                    aria-label={item.name}
                  >
                    {getUnicodeFlag(item.name)}
                  </span>
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
        <div className="space-y-3">
          <DeviceDonut data={devices} />
          <div className="border-border/50 h-16 space-y-1.5 overflow-y-auto border-t border-dashed pt-2.5 pr-1">
            {devices.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-muted-foreground font-medium">
                  {item.name}
                </span>
                <span className="text-foreground font-mono font-bold">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
