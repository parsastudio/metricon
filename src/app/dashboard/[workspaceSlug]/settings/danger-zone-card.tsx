"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DangerZoneProps {
  workspace: {
    id: string;
    slug: string;
  };
  isOwner: boolean;
}

export function DangerZoneCard({ workspace, isOwner }: DangerZoneProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    if (deleteConfirm !== workspace.slug) {
      toast.error(
        "Please enter the correct workspace slug to confirm deletion"
      );
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteWorkspace(workspace.id);
      if (res.success) {
        toast.success("Workspace deleted permanently");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Failed to delete workspace");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="bg-card border-destructive/20 rounded-xl border p-6 shadow-xs">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-destructive/10 text-destructive rounded-lg p-2">
          <ShieldAlert className="size-5" />
        </div>
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            Danger Zone Area
          </h3>
          <p className="text-muted-foreground text-xs">
            Permanent actions that cannot be recovered after confirmation.
          </p>
        </div>
      </div>

      <div className="bg-destructive/5 border-destructive/10 mb-6 rounded-lg border p-4">
        <h4 className="text-destructive flex items-center gap-1.5 text-xs font-bold">
          Warning Notice
        </h4>
        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
          Deleting this workspace will immediately invalidate all shortened
          links, erase access records and delete member associations
          permanently.
        </p>
      </div>

      <form onSubmit={handleDelete} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Type{" "}
            <span className="text-foreground font-bold select-all">
              {workspace.slug}
            </span>{" "}
            to authorize deletion
          </label>
          <input
            type="text"
            required
            placeholder="Confirm current slug..."
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="border-border focus:border-destructive w-full rounded-md border bg-transparent px-3 py-1.5 font-mono text-sm outline-hidden"
          />
        </div>

        <div className="border-border/60 flex justify-end border-t border-dashed pt-4">
          <Button
            type="submit"
            variant="destructive"
            disabled={deleting || deleteConfirm !== workspace.slug}
            className="cursor-pointer gap-2"
          >
            <Trash2 className="size-4" />
            {deleting
              ? "Deleting Workspace..."
              : "Permanently Delete Workspace"}
          </Button>
        </div>
      </form>
    </div>
  );
}
