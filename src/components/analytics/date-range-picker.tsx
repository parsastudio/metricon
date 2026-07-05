"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);

  const initialStart = searchParams?.get("start") || "";
  const initialEnd = searchParams?.get("end") || "";

  const [start, setStart] = React.useState(initialStart);
  const [end, setEnd] = React.useState(initialEnd);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("tf");
    params.set("start", start);
    params.set("end", end);

    setIsOpen(false);
    router.push(`?${params.toString()}`);
  };

  const handlePreset = (days: number) => {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - days);

    const startStr = startDateObj.toISOString().split("T")[0];
    const endStr = endDateObj.toISOString().split("T")[0];

    setStart(startStr);
    setEnd(endStr);
  };

  const activeRangeText =
    initialStart && initialEnd
      ? `${initialStart} to ${initialEnd}`
      : "Custom Range";

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border/60 hover:bg-muted cursor-pointer gap-2 text-xs font-semibold"
      >
        <Calendar className="size-3.5" />
        {activeRangeText}
      </Button>

      {isOpen && (
        <div className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-72 rounded-xl border p-4 shadow-xl">
          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => handlePreset(7)}
                className="border-border/60 hover:bg-muted rounded-md border py-1 text-[10px] font-bold"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePreset(30)}
                className="border-border/60 hover:bg-muted rounded-md border py-1 text-[10px] font-bold"
              >
                Last 30 Days
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="xs" className="gap-1">
                Apply <ArrowRight className="size-3" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
