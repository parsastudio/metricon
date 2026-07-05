"use client";

import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Calendar,
  Key,
  Trash2,
  Search,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  QrCode,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LinkEditor } from "./link-editor";
import { QrCodeDialog } from "./qr-code-dialog";
import { LinkItem } from "@/lib/validations";

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

  const handleCopyLink = (shortCode: string, linkId: string) => {
    const fullUrl = `${origin}/r/${workspacePrefix}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(linkId);
    toast.success("Short link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
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
            filteredLinks.map((link) => {
              const isOptimistic = link.id.startsWith("optimistic-");
              return (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className={`border-border bg-card hover:bg-muted/20 hover:border-border/80 flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-xs transition-all sm:flex-row sm:items-center ${isOptimistic ? "border-dashed border-amber-500/50 bg-amber-500/[0.01]" : ""}`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`truncate text-sm font-semibold transition-opacity ${link.isActive ? "text-foreground" : "text-muted-foreground/60 line-through"}`}
                      >
                        {link.title || "Untitled Link"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        {isOptimistic && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            <WifiOff className="size-2.5" />
                            PENDING SYNC
                          </span>
                        )}
                        {!link.isActive && (
                          <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            INACTIVE
                          </span>
                        )}
                        {link.password && (
                          <Key className="text-primary size-3" />
                        )}
                        {link.expiresAt && (
                          <Calendar className="text-primary size-3" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary font-bold">
                          /r/{workspacePrefix}/{link.shortCode}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyLink(link.shortCode, link.id)
                          }
                          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-sm p-0.5 transition-colors"
                        >
                          {copiedId === link.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-muted-foreground hidden sm:inline">
                        |
                      </span>
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary flex max-w-[200px] items-center gap-1 truncate sm:max-w-[300px]"
                      >
                        {link.originalUrl}
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  </div>
                  <div className="border-border/60 flex items-center justify-between gap-4 border-t border-dashed pt-3 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {link.iosUrl && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">
                            iOS
                          </span>
                        )}
                        {link.androidUrl && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">
                            Android
                          </span>
                        )}
                        {link.geoRouting && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">
                            Geo
                          </span>
                        )}
                        {!link.iosUrl &&
                          !link.androidUrl &&
                          !link.geoRouting && (
                            <span className="text-muted-foreground text-[10px]">
                              Standard
                            </span>
                          )}
                      </div>
                      <div className="bg-muted border-border/60 flex items-center gap-1.5 rounded-lg border px-2.5 py-1">
                        <span className="bg-primary inline-flex size-1.5 rounded-full" />
                        <span className="text-foreground font-mono text-xs font-bold">
                          {link.clicksCount} clicks
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(link.id, link.isActive)
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent outline-hidden transition-colors duration-200 ease-in-out ${
                          link.isActive
                            ? "bg-primary"
                            : "bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`bg-background pointer-events-none inline-block size-4 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
                            link.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          setQrLink({
                            url: `${origin}/r/${workspacePrefix}/${link.shortCode}`,
                            title: link.title || "Campaign Link",
                          })
                        }
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                      >
                        <QrCode className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (isOptimistic) {
                            toast.error(
                              "Cannot edit offline links pending synchronization."
                            );
                            return;
                          }
                          setEditingLink(link);
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
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
    </div>
  );
}
