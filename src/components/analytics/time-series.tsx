"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TimeSeriesProps {
  data: { date: string; clicks: number }[];
}

export function TimeSeriesSkeleton() {
  return (
    <div className="bg-card border-border h-[274px] animate-pulse space-y-4 rounded-xl border p-5">
      <div className="bg-muted/70 h-4 w-32 rounded" />
      <div className="flex h-48 w-full items-end justify-between gap-2 pt-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-muted/30 w-full rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TimeSeries({ data }: TimeSeriesProps) {
  return (
    <div className="bg-card border-border space-y-4 rounded-xl border p-5">
      <h3 className="text-sm font-semibold">Clicks Over Time</h3>
      {data.length === 0 ? (
        <div className="text-muted-foreground flex h-48 items-center justify-center text-xs">
          No records captured for this period.
        </div>
      ) : (
        <div className="h-48 w-full pt-4 font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => value.slice(5)}
                className="fill-muted-foreground text-[10px]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground text-[10px]"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClicks)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
