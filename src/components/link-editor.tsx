"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateLink } from "@/actions/links";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { QuotaGatekeeper } from "@/components/quota-gatekeeper";
import { Link2, Smartphone, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

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
  desktopUrl?: string | null;
  geoRouting?: Record<string, string> | null;
}

interface LinkEditorProps {
  workspaceId: string;
  isPro: boolean;
  link: LinkItem;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkEditor({
  workspaceId,
  isPro,
  link,
  isOpen,
  onClose,
}: LinkEditorProps) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [originalUrl, setOriginalUrl] = React.useState(link.originalUrl);
  const [title, setTitle] = React.useState(link.title || "");
  const [password, setPassword] = React.useState(link.password || "");
  const [expiresAt, setExpiresAt] = React.useState(
    link.expiresAt
      ? new Date(link.expiresAt).toISOString().substring(0, 16)
      : ""
  );

  const [iosUrl, setIosUrl] = React.useState(link.iosUrl || "");
  const [androidUrl, setAndroidUrl] = React.useState(link.androidUrl || "");

  const [geoCountry, setGeoCountry] = React.useState("");
  const [geoUrl, setGeoUrl] = React.useState("");
  const [geoRouting, setGeoRouting] = React.useState<Record<string, string>>(
    link.geoRouting || {}
  );

  const handleAddGeo = () => {
    if (!geoCountry || !geoUrl) return;
    setGeoRouting({ ...geoRouting, [geoCountry.toUpperCase()]: geoUrl });
    setGeoCountry("");
    setGeoUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) return;

    if (
      !isPro &&
      (iosUrl ||
        androidUrl ||
        Object.keys(geoRouting).length > 0 ||
        password ||
        expiresAt)
    ) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await updateLink({
        linkId: link.id,
        workspaceId,
        originalUrl,
        title,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
        iosUrl: iosUrl || undefined,
        androidUrl: androidUrl || undefined,
        geoRouting: Object.keys(geoRouting).length > 0 ? geoRouting : undefined,
      });

      if (!res.success) {
        toast.error("Failed to update link configurations");
        return;
      }

      toast.success("Link configurations updated successfully");
      onClose();
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose}>
        <form
          onSubmit={handleSubmit}
          className="max-h-[85vh] space-y-4 overflow-y-auto pr-1"
        >
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <Link2 className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Edit campaign settings</h3>
              <p className="text-muted-foreground text-xs">
                Modify destination targets, device redirects and routing country
                scopes.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Destination URL
              </label>
              <input
                type="url"
                required
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Short Code (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={link.shortCode}
                  className="border-border bg-muted/50 mt-1 w-full rounded-md border px-3 py-1.5 text-sm opacity-60 outline-hidden"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Internal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
                />
              </div>
            </div>

            <div className="border-border/60 space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-primary flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                  <Smartphone className="size-3.5" />
                  Device Targeting
                </span>
                {!isPro && (
                  <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                    PRO FEATURE
                  </span>
                )}
              </div>
              <div
                className="grid grid-cols-1 gap-2"
                onClick={() => !isPro && setShowUpgradeModal(true)}
              >
                <input
                  type="url"
                  readOnly={!isPro}
                  placeholder={
                    isPro ? "iOS Target URL" : "iOS Target URL (PRO Only)"
                  }
                  value={iosUrl}
                  onChange={(e) => isPro && setIosUrl(e.target.value)}
                  className={`border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden ${!isPro ? "cursor-pointer opacity-60" : ""}`}
                />
                <input
                  type="url"
                  readOnly={!isPro}
                  placeholder={
                    isPro
                      ? "Android Target URL"
                      : "Android Target URL (PRO Only)"
                  }
                  value={androidUrl}
                  onChange={(e) => isPro && setAndroidUrl(e.target.value)}
                  className={`border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden ${!isPro ? "cursor-pointer opacity-60" : ""}`}
                />
              </div>
            </div>

            <div className="border-border/60 space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-primary flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                  <Globe className="size-3.5" />
                  Geo Targeting
                </span>
              </div>
              <div onClick={() => !isPro && setShowUpgradeModal(true)}>
                {isPro ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="US"
                      value={geoCountry}
                      onChange={(e) => setGeoCountry(e.target.value)}
                      className="border-border focus:border-primary w-16 rounded-md border bg-transparent px-3 py-1.5 text-xs uppercase outline-hidden"
                    />
                    <input
                      type="url"
                      placeholder="Routing URL"
                      value={geoUrl}
                      onChange={(e) => setGeoUrl(e.target.value)}
                      className="border-border focus:border-primary flex-1 rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden"
                    />
                    <Button type="button" onClick={handleAddGeo} size="sm">
                      Add
                    </Button>
                  </div>
                ) : (
                  <div className="border-border text-muted-foreground flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed py-3 text-xs opacity-60">
                    Click to unlock Geographic Routing limits
                  </div>
                )}
              </div>
              {Object.keys(geoRouting).length > 0 && (
                <div className="bg-muted space-y-1 rounded-lg p-2">
                  {Object.entries(geoRouting).map(([country, url]) => (
                    <div
                      key={country}
                      className="flex items-center justify-between font-mono text-[11px]"
                    >
                      <span>
                        {country}: {url}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...geoRouting };
                          delete next[country];
                          setGeoRouting(next);
                        }}
                        className="text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-border/60 space-y-3 border-t pt-3">
              <span className="text-primary flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                <Lock className="size-3.5" />
                Protection & Limits
              </span>
              <div
                className="grid grid-cols-2 gap-2"
                onClick={() => !isPro && setShowUpgradeModal(true)}
              >
                <input
                  type="password"
                  readOnly={!isPro}
                  placeholder={isPro ? "Password" : "Password (PRO)"}
                  value={password}
                  onChange={(e) => isPro && setPassword(e.target.value)}
                  className={`border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden ${!isPro ? "cursor-pointer opacity-60" : ""}`}
                />
                <input
                  type={isPro ? "datetime-local" : "text"}
                  readOnly={!isPro}
                  placeholder={isPro ? "" : "Expiration (PRO)"}
                  value={expiresAt}
                  onChange={(e) => isPro && setExpiresAt(e.target.value)}
                  className={`border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden ${!isPro ? "cursor-pointer opacity-60" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      <QuotaGatekeeper
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        workspaceId={workspaceId}
      />
    </>
  );
}
