import * as React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { DashboardNav } from "@/components/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Link2,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth");
  }

  const workspaces = await getWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);

  if (!currentWorkspace) {
    if (workspaces.length > 0) {
      redirect(`/dashboard/${workspaces[0].slug}`);
    } else {
      redirect("/auth");
    }
  }

  const menuItems = [
    {
      name: "My Links",
      href: `/dashboard/${workspaceSlug}/links`,
      icon: Link2,
    },
    {
      name: "Analytics",
      href: `/dashboard/${workspaceSlug}/analytics`,
      icon: BarChart3,
    },
    {
      name: "Team Members",
      href: `/dashboard/${workspaceSlug}/members`,
      icon: Users,
    },
    {
      name: "Billing Plan",
      href: `/dashboard/${workspaceSlug}/billing`,
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: `/dashboard/${workspaceSlug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="border-border/60 bg-sidebar flex w-64 shrink-0 flex-col justify-between border-r">
        <div>
          <div className="flex items-center gap-2 px-5 py-4">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Metricon</span>
          </div>

          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />

          <DashboardNav items={menuItems} />
        </div>

        <div className="border-border/50 flex items-center justify-between border-t p-4">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{user.name}</div>
            <div className="text-muted-foreground truncate text-[10px]">
              {user.email}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
