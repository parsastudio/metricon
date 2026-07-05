"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DeviceDonutProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "var(--color-primary)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export function DeviceDonut({ data }: DeviceDonutProps) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
        No device metrics captured.
      </div>
    );
  }

  return (
    <div className="h-44 w-full font-sans text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={64}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              borderRadius: "0.5rem",
              fontSize: "11px",
            }}
            itemStyle={{ color: "var(--color-foreground)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            iconSize={6}
            formatter={(value: string) => (
              <span className="text-muted-foreground text-[10px] capitalize">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
