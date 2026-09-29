"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Link2, Sparkles, Smartphone, Globe, Lock } from "lucide-react";

interface LinkCreatorFormProps {
  isPro: boolean;
  loading: boolean;
  originalUrl: string;
  setOriginalUrl: (url: string) => void;
  shortCode: string;
  setShortCode: (code: string) => void;
  title: string;
  setTitle: (title: string) => void;
  password: string;
  setPassword: (pass: string) => void;
  expiresAt: string;
  setExpiresAt: (expires: string) => void;
  maxClicks: number | undefined;
  setMaxClicks: (clicks: number | undefined) => void;
  iosUrl: string;
  setIosUrl: (url: string) => void;
  androidUrl: string;
  setAndroidUrl: (url: string) => void;
  geoCountry: string;
  setGeoCountry: (country: string) => void;
  geoUrl: string;
  setGeoUrl: (url: string) => void;
  geoRouting: Record<string, string>;
  onAddGeo: () => void;
  onRemoveGeo: (country: string) => void;
  onUpgradePrompt: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function LinkCreatorForm({
  isPro,
  loading,
  originalUrl,
  setOriginalUrl,
  shortCode,
  setShortCode,
  title,
  setTitle,
  password,
  setPassword,
  expiresAt,
  setExpiresAt,
  maxClicks,
  setMaxClicks,
  iosUrl,
  setIosUrl,
  androidUrl,
  setAndroidUrl,
  geoCountry,
  setGeoCountry,
  geoUrl,
  setGeoUrl,
  geoRouting,
  onAddGeo,
  onRemoveGeo,
  onUpgradePrompt,
  onSubmit,
  onCancel,
}: LinkCreatorFormProps) {
  const handleGenerateCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomCode = "";
    for (let i = 0; i < 5; i++) {
      randomCode += chars[Math.floor(Math.random() * chars.length)];
    }
    setShortCode(randomCode);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="max-h-[85vh] space-y-4 overflow-y-auto pr-1"
    >
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary rounded-lg p-2">
          <Link2 className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Create short link</h3>
          <p className="text-muted-foreground text-xs">
            Setup target links, device and geographic routes.
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
            placeholder="https://example.com/long-page-slug"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Short Code
              </label>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="text-primary hover:text-primary/80 flex cursor-pointer items-center gap-1 text-[10px] font-bold transition-colors"
              >
                <Sparkles className="size-3" />
                Auto
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="promo2026"
              value={shortCode}
              onChange={(e) =>
                setShortCode(
                  e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
                )
              }
              className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Internal Title
            </label>
            <input
              type="text"
              placeholder="Marketing Link"
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
            onClick={() => !isPro && onUpgradePrompt()}
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
                isPro ? "Android Target URL" : "Android Target URL (PRO Only)"
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
          <div onClick={() => !isPro && onUpgradePrompt()}>
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
                <Button type="button" onClick={onAddGeo} size="sm">
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
                    onClick={() => onRemoveGeo(country)}
                    className="text-destructive underline"
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
            className="grid grid-cols-3 gap-2"
            onClick={() => !isPro && onUpgradePrompt()}
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
            <input
              type="number"
              min={1}
              readOnly={!isPro}
              placeholder={isPro ? "Max Clicks" : "Max Clicks (PRO)"}
              value={maxClicks || ""}
              onChange={(e) =>
                isPro &&
                setMaxClicks(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className={`border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden ${!isPro ? "cursor-pointer opacity-60" : ""}`}
            />
          </div>
        </div>
      </div>

      <div className="border-border flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Link"}
        </Button>
      </div>
    </form>
  );
}
