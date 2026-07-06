"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Link2,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react";

const iconMap = {
  links: Link2,
  analytics: BarChart3,
  members: Users,
  billing: CreditCard,
  settings: Settings,
} as const;

export type NavIconType = keyof typeof iconMap;

interface NavItem {
  name: string;
  href: string;
  icon: NavIconType;
}

interface DashboardNavProps {
  items: NavItem[];
}

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-3">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || HelpCircle;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-primary/10 shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 transition-transform group-hover:scale-105",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
