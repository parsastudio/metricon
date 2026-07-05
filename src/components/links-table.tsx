"use client";

import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteLink } from "@/actions/links";
import { Calendar, Key, Trash2, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOrigin } from "@/hooks/use-origin";

interface LinkItem {
  id: string;
  workspaceId: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  isActive: boolean;
  password?: string | null;
  expiresAt?: Date | null;
  clicksCount: number;
  iosUrl?: string | null;
  androidUrl?: string | null;
  geoRouting?: Record<string, string> | null;
}

interface LinksTableProps {
  workspaceId: string;
  workspacePrefix: string;
  initialLinks: LinkItem[];
}

export function LinksTable({
  workspaceId,
  workspacePrefix,
  initialLinks,
}: LinksTableProps) {
  const router = useRouter();
  const origin = useOrigin();
  const [linksList, setLinksList] = React.useState<LinkItem[]>(initialLinks);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [targetFilter, setTargetFilter] = React.useState<
    "all" | "standard" | "targeted"
  >("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "clicks">("newest");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleDelete = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this tracking link?")) return;
    try {
      const res = await deleteLink(workspaceId, linkId);
      if (res.success) {
        setLinksList(linksList.filter((l) => l.id !== linkId));
        toast.success("Link deleted successfully");
        router.refresh();
      } else {
        toast.error("Failed to delete link: " + res.error);
      }
    } catch {
      toast.error("Failed to delete link");
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
        const dateA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const dateB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
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

      <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground border-border border-b font-semibold tracking-wider uppercase">
              <tr>
                <th className="p-4">Title / Code</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Targeting</th>
                <th className="p-4 text-center">Clicks</th>
                <th className="p-4">Security</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground p-8 text-center"
                  >
                    No matching short codes mapped to current filters.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="text-foreground font-semibold">
                        {link.title || "Untitled Link"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-primary font-mono text-[10px]">
                          /r/{workspacePrefix}/{link.shortCode}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyLink(link.shortCode, link.id)
                          }
                          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-sm p-0.5 transition-colors"
                          title="Copy short link"
                        >
                          {copiedId === link.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="text-muted-foreground max-w-xs truncate p-4 font-mono">
                      {link.originalUrl}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {link.iosUrl && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-bold">
                            iOS
                          </span>
                        )}
                        {link.androidUrl && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-bold">
                            Android
                          </span>
                        )}
                        {link.geoRouting && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-bold">
                            Geo
                          </span>
                        )}
                        {!link.iosUrl &&
                          !link.androidUrl &&
                          !link.geoRouting && (
                            <span className="text-muted-foreground font-mono">
                              Standard
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold">
                      {link.clicksCount}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {link.password && (
                          <Key className="text-primary size-3.5" />
                        )}
                        {link.expiresAt && (
                          <Calendar className="text-primary size-3.5" />
                        )}
                        {!link.password && !link.expiresAt && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
