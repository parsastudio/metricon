"use client";

import * as React from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
}

interface WorkspaceSwitcherPresenterProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  name: string;
  setName: (name: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  loading: boolean;
  onSelectWorkspace: (slug: string) => void;
  onSubmitCreate: (e: React.FormEvent) => void;
}

export function WorkspaceSwitcherPresenter({
  workspaces,
  currentWorkspace,
  isDialogOpen,
  setIsDialogOpen,
  name,
  setName,
  slug,
  setSlug,
  loading,
  onSelectWorkspace,
  onSubmitCreate,
}: WorkspaceSwitcherPresenterProps) {
  return (
    <>
      <div className="border-border/50 border-b px-4 py-3">
        <Dropdown
          trigger={
            <button className="border-border bg-card hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-all">
              <div className="flex items-center gap-2">
                <Building2 className="text-primary size-4" />
                <span className="max-w-[120px] truncate">
                  {currentWorkspace?.name}
                </span>
              </div>
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </button>
          }
        >
          <div className="py-1">
            <div className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.slug)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  ws.id === currentWorkspace?.id
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex-1 truncate">{ws.name}</div>
                {ws.plan === "pro" && (
                  <span className="bg-primary/10 text-primary rounded px-1 text-[10px] font-bold">
                    PRO
                  </span>
                )}
              </button>
            ))}
            <div className="border-border mt-1 border-t">
              <button
                onClick={() => setIsDialogOpen(true)}
                className="text-primary hover:bg-muted flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="size-4" />
                Create Workspace
              </button>
            </div>
          </div>
        </Dropdown>
      </div>

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <form onSubmit={onSubmitCreate} className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">New Workspace</h3>
            <p className="text-muted-foreground text-sm">
              Create a separate space for your team or clients.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-")
                  );
                }}
                className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Slug URL
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
                  )
                }
                className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
