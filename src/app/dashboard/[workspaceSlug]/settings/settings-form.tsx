"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateWorkspace, deleteWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Trash2,
  Save,
  Terminal,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsFormProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    shortPrefix: string;
    plan: "free" | "pro";
  };
  isOwner: boolean;
}

export function SettingsForm({ workspace, isOwner }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(workspace.name);
  const [slug, setSlug] = React.useState(workspace.slug);
  const [shortPrefix, setShortPrefix] = React.useState(workspace.shortPrefix);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

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

  const copyToClipboard = (codeText: string, label: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(label);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const listUrl = `curl -X GET "https://metricon.co/api/v1/links?workspaceId=${workspace.id}" \\
  -H "Authorization: Bearer <YOUR_USER_ID>"`;

  const createUrl = `curl -X POST "https://metricon.co/api/v1/links" \\
  -H "Authorization: Bearer <YOUR_USER_ID>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspaceId": "${workspace.id}",
    "originalUrl": "https://example.com",
    "shortCode": "custom-campaign"
  }'`;

  return (
    <div className="space-y-6">
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
              You are viewing settings in Read-Only mode. Contact workspace
              owner to make edits.
            </span>
          </div>
        )}
      </form>

      <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <Code2 className="size-5" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Developer API & Integrations
            </h3>
            <p className="text-muted-foreground text-xs">
              Automate link creations programmatically using standard REST API
              requests.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/40 border-border/60 rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground flex items-center gap-1.5">
                <Terminal className="text-primary size-4" /> Fetch All Links
                (GET)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(listUrl, "get")}
                className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-[11px]"
              >
                {copiedCode === "get" ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-black p-3.5 font-mono text-[11px] text-slate-300">
              {listUrl}
            </pre>
          </div>

          <div className="bg-muted/40 border-border/60 rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground flex items-center gap-1.5">
                <Terminal className="text-primary size-4" /> Create Shortened
                Link (POST)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(createUrl, "post")}
                className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-[11px]"
              >
                {copiedCode === "post" ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-black p-3.5 font-mono text-[11px] text-slate-300">
              {createUrl}
            </pre>
          </div>
        </div>
      </div>

      {isOwner && (
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
      )}
    </div>
  );
}
