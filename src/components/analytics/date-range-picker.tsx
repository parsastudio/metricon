"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);

  const initialStart = searchParams?.get("start") || "";
  const initialEnd = searchParams?.get("end") || "";

  const [start, setStart] = React.useState(initialStart);
  const [end, setEnd] = React.useState(initialEnd);

  const [currentYear, setCurrentYear] = React.useState(
    new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    const startYear = startDateObj.getFullYear().toString();
    const startMonth = (startDateObj.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const startDay = startDateObj.getDate().toString().padStart(2, "0");
    const startStr = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endDateObj.getFullYear().toString();
    const endMonth = (endDateObj.getMonth() + 1).toString().padStart(2, "0");
    const endDay = endDateObj.getDate().toString().padStart(2, "0");
    const endStr = `${endYear}-${endMonth}-${endDay}`;

    setStart(startStr);
    setEnd(endStr);

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("tf");
    params.set("start", startStr);
    params.set("end", endStr);

    setIsOpen(false);
    router.push(`?${params.toString()}`);
  };

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayIndex = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const yearStr = currentYear.toString();
    const monthStr = (currentMonth + 1).toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    const dateString = `${yearStr}-${monthStr}-${dayStr}`;

    if (!start || (start && end)) {
      setStart(dateString);
      setEnd("");
    } else if (start && !end) {
      if (dateString < start) {
        setStart(dateString);
      } else {
        setEnd(dateString);
      }
    }
  };

  const changeMonth = (direction: number) => {
    let nextMonth = currentMonth + direction;
    let nextYear = currentYear;

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const activeRangeText =
    initialStart && initialEnd
      ? `${initialStart} to ${initialEnd}`
      : "Custom Range";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const totalDays = daysInMonth(currentYear, currentMonth);
  const offset = firstDayIndex(currentYear, currentMonth);
  const calendarCells = Array.from({ length: offset + totalDays });

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border/60 hover:bg-muted cursor-pointer gap-2 text-xs font-semibold"
      >
        <CalendarIcon className="size-3.5" />
        {activeRangeText}
      </Button>

      {isOpen && (
        <div className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-[340px] rounded-xl border p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5 pb-3">
            <button
              type="button"
              onClick={() => handlePreset(7)}
              className="border-border/60 hover:bg-muted text-foreground cursor-pointer rounded-md border py-1 text-[10px] font-bold"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset(30)}
              className="border-border/60 hover:bg-muted text-foreground cursor-pointer rounded-md border py-1 text-[10px] font-bold"
            >
              Last 30 Days
            </button>
          </div>

          <div className="border-border/40 border-t pt-3">
            <div className="flex items-center justify-between pb-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="hover:bg-muted cursor-pointer rounded p-1"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-foreground text-xs font-bold">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="hover:bg-muted cursor-pointer rounded p-1"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="text-muted-foreground grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-semibold">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarCells.map((_, index) => {
                if (index < offset) {
                  return <div key={`empty-${index}`} />;
                }

                const day = index - offset + 1;
                const yearStr = currentYear.toString();
                const monthStr = (currentMonth + 1).toString().padStart(2, "0");
                const dayStr = day.toString().padStart(2, "0");
                const cellDateStr = `${yearStr}-${monthStr}-${dayStr}`;

                const isSelectedStart = start === cellDateStr;
                const isSelectedEnd = end === cellDateStr;
                const isInRange =
                  start && end && cellDateStr > start && cellDateStr < end;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[11px] font-medium transition-all ${
                      isSelectedStart || isSelectedEnd
                        ? "bg-primary text-primary-foreground font-bold"
                        : isInRange
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-border/40 mt-4 flex items-center justify-between border-t pt-3">
            <div className="text-muted-foreground flex flex-col gap-0.5 text-[10px]">
              <span>Start: {start || "—"}</span>
              <span>End: {end || "—"}</span>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleApply()}
                disabled={!start || !end}
                size="xs"
                className="gap-1"
              >
                Apply <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
