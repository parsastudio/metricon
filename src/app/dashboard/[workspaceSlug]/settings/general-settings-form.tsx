"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface GeneralSettingsProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    shortPrefix: string;
    plan: "free" | "pro";
  };
  isOwner: boolean;
}

export function GeneralSettingsForm({
  workspace,
  isOwner,
}: GeneralSettingsProps) {
  const router = useRouter();
  const [name, setName] = React.useState(workspace.name);
  const [slug, setSlug] = React.useState(workspace.slug);
  const [shortPrefix, setShortPrefix] = React.useState(workspace.shortPrefix);
  const [saving, setSaving] = React.useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error("Only workspace owners can perform this action");
      return;
    }

    setSaving(true);
    try {
      const res = await updateWorkspace(workspace.id, name, slug, shortPrefix);
      if (res.success && res.slug) {
        toast.success("Workspace settings updated successfully");
        router.push(`/dashboard/${res.slug}/settings`);
        router.refresh();
      } else if (res.error === "SLUG_EXISTS") {
        toast.error("The requested URL slug is already taken");
      } else if (res.error === "PREFIX_EXISTS") {
        toast.error("This workspace routing prefix is already allocated");
      } else {
        toast.error("Failed to update workspace details");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleUpdate}
      className="bg-card border-border rounded-xl border p-6 shadow-sm"
    >
      <div className="mb-6 space-y-1">
        <h3 className="text-sm font-semibold">General Profile</h3>
        <p className="text-muted-foreground text-xs">
          Modify corporate credentials and access slugs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Workspace Name
          </label>
          <input
            type="text"
            required
            disabled={!isOwner}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            URL Slug Path
          </label>
          <div className="flex rounded-md shadow-xs">
            <span className="border-border bg-muted text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-xs select-none">
              /dashboard/
            </span>
            <input
              type="text"
              required
              disabled={!isOwner}
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
                )
              }
              className="border-border focus:border-primary w-full rounded-r-md border bg-transparent px-3 py-1.5 text-sm outline-hidden disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
            Workspace Prefix (Vanity Router)
            {workspace.plan !== "pro" && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[8px] font-bold">
                PRO ONLY
              </span>
            )}
          </label>
          <div className="flex rounded-md shadow-xs">
            <span className="border-border bg-muted text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-xs select-none">
              /r/
            </span>
            <input
              type="text"
              required
              disabled={!isOwner || workspace.plan !== "pro"}
              value={shortPrefix}
              onChange={(e) =>
                setShortPrefix(
                  e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
                )
              }
              className="border-border focus:border-primary w-full rounded-r-md border bg-transparent px-3 py-1.5 font-mono text-sm outline-hidden disabled:opacity-50"
            />
          </div>
          {workspace.plan !== "pro" && (
            <p className="text-muted-foreground text-[10px] leading-normal">
              Upgrade to Pro plan to personalize brand vanity prefixes and
              custom routing domains.
            </p>
          )}
        </div>
      </div>

      {isOwner ? (
        <div className="border-border/60 mt-6 flex justify-end border-t border-dashed pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="cursor-pointer gap-2"
          >
            <Save className="size-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      ) : (
        <div className="border-border/60 bg-muted/40 text-muted-foreground mt-6 flex items-center gap-2.5 rounded-lg border p-3.5 text-xs">
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            You are viewing settings in Read-Only mode. Contact workspace owner
            to make edits.
          </span>
        </div>
      )}
    </form>
  );
}
