"use client";

import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { LinkEditor } from "./link-editor";
import { QrCodeDialog } from "./qr-code-dialog";
import { RedirectSimulatorDialog } from "./redirect-simulator-dialog";
import { LinkItem } from "@/lib/validations";
import { safeCopyToClipboard } from "@/lib/utils";
import { LinkRow } from "./link-row";

interface LinksTableProps {
  workspaceId: string;
  workspacePrefix: string;
  initialLinks: LinkItem[];
  isPro: boolean;
  origin: string;
  onDelete: (linkId: string) => Promise<void>;
  onToggleActive: (linkId: string, isActive: boolean) => Promise<void>;
  onUpdateLink: (data: Record<string, unknown>) => Promise<void>;
}

export function LinksTable({
  workspaceId,
  workspacePrefix,
  initialLinks,
  isPro,
  origin,
  onDelete,
  onToggleActive,
  onUpdateLink,
}: LinksTableProps) {
  const [linksList, setLinksList] = React.useState<LinkItem[]>(initialLinks);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [targetFilter, setTargetFilter] = React.useState<
    "all" | "standard" | "targeted"
  >("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "clicks">("newest");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [editingLink, setEditingLink] = React.useState<LinkItem | null>(null);
  const [simulatorLink, setSimulatorLink] = React.useState<LinkItem | null>(null);
  const [qrLink, setQrLink] = React.useState<{
    url: string;
    title: string;
  } | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    setLinksList(initialLinks);
  }, [initialLinks]);

  const handleDelete = async (linkId: string) => {
    if (linkId.startsWith("optimistic-")) {
      setLinksList(linksList.filter((l) => l.id !== linkId));
      toast.success("Offline draft link discarded");
      return;
    }
    if (!confirm("Are you sure you want to delete this tracking link?")) return;
    try {
      await onDelete(linkId);
      toast.success("Link deleted successfully");
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const handleToggleActive = async (linkId: string, currentStatus: boolean) => {
    if (linkId.startsWith("optimistic-")) {
      toast.error(
        "Cannot toggle active status on offline links pending synchronization."
      );
      return;
    }
    const nextStatus = !currentStatus;
    setLinksList((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, isActive: nextStatus } : l))
    );
    try {
      await onToggleActive(linkId, nextStatus);
      toast.success(
        nextStatus ? "Tracking link activated" : "Tracking link deactivated"
      );
    } catch {
      setLinksList((prev) =>
        prev.map((l) =>
          l.id === linkId ? { ...l, isActive: currentStatus } : l
        )
      );
      toast.error("Failed to update link status");
    }
  };

  const handleCopyLink = async (shortCode: string, linkId: string) => {
    const currentOrigin =
      origin ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://metricon.co");
    const fullUrl = `${currentOrigin}/r/${workspacePrefix}/${shortCode}`;
    const success = await safeCopyToClipboard(fullUrl);
    if (success) {
      setCopiedId(linkId);
      toast.success("Short link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const filteredLinks = React.useMemo(() => {
    let result = [...linksList];
    if (debouncedSearch) {
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.shortCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.originalUrl.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    if (targetFilter !== "all") {
      result = result.filter((l) => {
        const hasTargeting = !!(l.iosUrl || l.androidUrl || l.geoRouting);
        return targetFilter === "targeted" ? hasTargeting : !hasTargeting;
      });
    }
    if (sortBy === "clicks") {
      result.sort((a, b) => b.clicksCount - a.clicksCount);
    } else {
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return result;
  }, [linksList, debouncedSearch, targetFilter, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <input
            type="text"
            placeholder="Search title, shortcode or url..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border focus:border-primary placeholder:text-muted-foreground/70 bg-card w-full rounded-lg border py-1.5 pr-3 pl-9 text-xs outline-hidden"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-card border-border flex items-center gap-1 rounded-lg border p-1 text-xs font-medium">
            <button
              onClick={() => setTargetFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors ${targetFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              All
            </button>
            <button
              onClick={() => setTargetFilter("standard")}
              className={`rounded-md px-2.5 py-1 transition-colors ${targetFilter === "standard" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Standard
            </button>
            <button
              onClick={() => setTargetFilter("targeted")}
              className={`rounded-md px-2.5 py-1 transition-colors ${targetFilter === "targeted" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Targeted
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "clicks")}
            className="border-border bg-card text-foreground cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium outline-hidden"
          >
            <option value="newest">Sort: Newest</option>
            <option value="clicks">Sort: Most Clicks</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredLinks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-xs"
            >
              No matching short codes mapped to current filters.
            </motion.div>
          ) : (
            filteredLinks.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                workspacePrefix={workspacePrefix}
                isPro={isPro}
                origin={origin}
                copiedId={copiedId}
                onCopy={handleCopyLink}
                onToggleActive={handleToggleActive}
                onSelectSimulator={(l) => setSimulatorLink(l)}
                onSelectQr={(url, title) => setQrLink({ url, title })}
                onSelectEdit={(l) => {
                  if (l.id.startsWith("optimistic-")) {
                    toast.error(
                      "Cannot edit offline links pending synchronization."
                    );
                    return;
                  }
                  setEditingLink(l);
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>
      {editingLink && (
        <LinkEditor
          workspaceId={workspaceId}
          isPro={isPro}
          link={editingLink}
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          onUpdate={onUpdateLink}
        />
      )}
      {qrLink && (
        <QrCodeDialog
          url={qrLink.url}
          title={qrLink.title}
          isOpen={!!qrLink}
          onClose={() => setQrLink(null)}
        />
      )}
      <RedirectSimulatorDialog
        link={simulatorLink}
        workspacePrefix={workspacePrefix}
        origin={origin}
        isOpen={!!simulatorLink}
        onClose={() => setSimulatorLink(null)}
      />
    </div>
  );
}
