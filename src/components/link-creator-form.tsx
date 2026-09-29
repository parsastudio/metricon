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

export function LinkCreatorForm(props: LinkCreatorFormProps) {
  const handleAutoCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    props.setShortCode(code);
  };

  return (
    <form onSubmit={props.onSubmit} className="max-h-[85vh] space-y-4 overflow-y-auto pr-1">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary rounded-lg p-2"><Link2 className="size-5" /></div>
        <div>
          <h3 className="text-lg font-bold">Create short link</h3>
          <p className="text-muted-foreground text-xs">Setup target links, device and geographic routes.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-muted-foreground text-[10px] font-bold uppercase">Destination URL</label>
          <input
            type="url"
            required
            placeholder="https://example.com/promo"
            value={props.originalUrl}
            onChange={(e) => props.setOriginalUrl(e.target.value)}
            className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground text-[10px] font-bold uppercase">Short Code</label>
              <button type="button" onClick={handleAutoCode} className="text-primary flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                <Sparkles className="size-3" /> Auto
              </button>
            </div>
            <input
              type="text"
              required
              value={props.shortCode}
              onChange={(e) => props.setShortCode(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, ""))}
              className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-[10px] font-bold uppercase">Internal Title</label>
            <input
              type="text"
              value={props.title}
              onChange={(e) => props.setTitle(e.target.value)}
              className="border-border focus:border-primary mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
            />
          </div>
        </div>

        <div className="border-border/60 space-y-2 border-t pt-3" onClick={() => !props.isPro && props.onUpgradePrompt()}>
          <div className="flex items-center justify-between">
            <span className="text-primary flex items-center gap-1 text-xs font-bold uppercase"><Smartphone className="size-3.5" /> Device Routes</span>
            {!props.isPro && <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">PRO</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="url" readOnly={!props.isPro} placeholder={props.isPro ? "iOS URL" : "iOS (PRO)"} value={props.iosUrl} onChange={(e) => props.isPro && props.setIosUrl(e.target.value)} className="border-border rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden" />
            <input type="url" readOnly={!props.isPro} placeholder={props.isPro ? "Android URL" : "Android (PRO)"} value={props.androidUrl} onChange={(e) => props.isPro && props.setAndroidUrl(e.target.value)} className="border-border rounded-md border bg-transparent px-3 py-1.5 text-xs outline-hidden" />
          </div>
        </div>

        <div className="border-border/60 space-y-2 border-t pt-3" onClick={() => !props.isPro && props.onUpgradePrompt()}>
          <span className="text-primary flex items-center gap-1 text-xs font-bold uppercase"><Globe className="size-3.5" /> Geo Targeting</span>
          {props.isPro ? (
            <div className="flex gap-2">
              <input type="text" maxLength={2} placeholder="US" value={props.geoCountry} onChange={(e) => props.setGeoCountry(e.target.value)} className="border-border w-14 rounded-md border bg-transparent px-2 py-1 text-xs uppercase" />
              <input type="url" placeholder="Routing URL" value={props.geoUrl} onChange={(e) => props.setGeoUrl(e.target.value)} className="border-border flex-1 rounded-md border bg-transparent px-3 py-1 text-xs" />
              <Button type="button" onClick={props.onAddGeo} size="xs">Add</Button>
            </div>
          ) : (
            <div className="border-border text-muted-foreground flex w-full cursor-pointer justify-center rounded-md border border-dashed py-2 text-xs opacity-60">Unlock Geo Routing</div>
          )}
        </div>

        <div className="border-border/60 space-y-2 border-t pt-3" onClick={() => !props.isPro && props.onUpgradePrompt()}>
          <span className="text-primary flex items-center gap-1 text-xs font-bold uppercase"><Lock className="size-3.5" /> Security</span>
          <div className="grid grid-cols-3 gap-2">
            <input type="password" readOnly={!props.isPro} placeholder="Password" value={props.password} onChange={(e) => props.isPro && props.setPassword(e.target.value)} className="border-border rounded-md border bg-transparent px-2 py-1.5 text-xs outline-hidden" />
            <input type={props.isPro ? "datetime-local" : "text"} readOnly={!props.isPro} placeholder="Expires" value={props.expiresAt} onChange={(e) => props.isPro && props.setExpiresAt(e.target.value)} className="border-border rounded-md border bg-transparent px-2 py-1.5 text-xs outline-hidden" />
            <input type="number" min={1} readOnly={!props.isPro} placeholder="Clicks" value={props.maxClicks || ""} onChange={(e) => props.isPro && props.setMaxClicks(e.target.value ? parseInt(e.target.value) : undefined)} className="border-border rounded-md border bg-transparent px-2 py-1.5 text-xs outline-hidden" />
          </div>
        </div>
      </div>

      <div className="border-border flex justify-end gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={props.onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={props.loading}>{props.loading ? "Creating..." : "Create Link"}</Button>
      </div>
    </form>
  );
}
