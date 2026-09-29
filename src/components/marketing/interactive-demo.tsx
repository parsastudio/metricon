"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, Smartphone, Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLandingDemoLink } from "@/actions/landing-demo";

const emptySubscribe = () => () => {};

export function InteractiveDemo() {
  const [url, setUrl] = React.useState("");
  const [isShortened, setIsShortened] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"targeting" | "telemetry">("targeting");
  const [simulatedClicks, setSimulatedClicks] = React.useState(142);
  const [loading, setLoading] = React.useState(false);
  const [shortCode, setShortCode] = React.useState("promo");
  const [workspacePrefix, setWorkspacePrefix] = React.useState("premium");

  const origin = React.useSyncExternalStore(emptySubscribe, () => window.location.origin, () => "https://metricon.co");
  const cleanOrigin = origin.replace(/^https?:\/\//, "");

  React.useEffect(() => {
    if (!isShortened) return;
    const interval = setInterval(() => {
      setSimulatedClicks((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isShortened]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const res = await createLandingDemoLink(url);
      if (res.success && res.shortCode) {
        setWorkspacePrefix("demo");
        setShortCode(res.shortCode);
      }
    } finally {
      setLoading(false);
      setIsShortened(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${origin}/r/${workspacePrefix}/${shortCode}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="border-border/60 bg-card/60 mx-auto mt-16 max-w-3xl rounded-2xl border p-6 shadow-2xl backdrop-blur-md">
      <div className="border-border/40 mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-2.5 rounded-full bg-red-500" /><div className="flex size-2.5 rounded-full bg-yellow-500" /><div className="flex size-2.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground ml-2 font-mono text-[11px]">metricon-sandbox.sh</span>
        </div>
        <div className="bg-muted/60 text-primary flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
          <Sparkles className="size-3" /> LIVE PREVIEW
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isShortened ? (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleShorten} className="space-y-4">
            <div className="text-left">
              <h4 className="text-foreground text-sm font-bold">Paste destination URL</h4>
              <p className="text-muted-foreground text-[11px]">Experience lightning-fast dynamic redirection.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="url" required placeholder="https://example.com/unoptimized-link" value={url} onChange={(e) => setUrl(e.target.value)} className="border-border bg-background/50 flex-1 rounded-lg border px-4 py-2 text-xs outline-hidden" />
              <Button type="submit" disabled={loading} className="cursor-pointer gap-2">{loading ? "Optimizing..." : "Shorten URL"}<ArrowRight className="size-3.5" /></Button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-muted/40 flex items-center justify-between rounded-xl p-3.5">
              <div className="font-mono text-sm font-bold text-primary">{cleanOrigin}/r/{workspacePrefix}/{shortCode}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1 text-xs">{isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}{isCopied ? "Copied" : "Copy"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsShortened(false)}><RotateCcw className="size-3.5" /></Button>
              </div>
            </div>
            <div className="flex gap-2 border-b border-border/40 pb-1">
              <button type="button" onClick={() => setActiveTab("targeting")} className={`px-3 py-1.5 text-xs font-bold border-b-2 ${activeTab === "targeting" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Targeting</button>
              <button type="button" onClick={() => setActiveTab("telemetry")} className={`px-3 py-1.5 text-xs font-bold border-b-2 ${activeTab === "telemetry" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Telemetry</button>
            </div>
            {activeTab === "targeting" ? (
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="border-border rounded-lg border p-3 text-xs"><span className="flex items-center gap-1 font-bold"><Smartphone className="size-3.5 text-primary" /> Device Routes</span><div className="text-muted-foreground mt-2 font-mono text-[11px]">iOS ➔ App Store<br />Android ➔ Google Play</div></div>
                <div className="border-border rounded-lg border p-3 text-xs"><span className="flex items-center gap-1 font-bold"><Globe className="size-3.5 text-primary" /> Geo Filters</span><div className="text-muted-foreground mt-2 font-mono text-[11px]">US ➔ us.store.com<br />UK ➔ uk.store.com</div></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="border-border rounded-lg border p-3"><span className="text-muted-foreground text-[10px] font-bold uppercase">Simulated Clicks</span><div className="text-xl font-bold font-mono mt-1 text-foreground">{simulatedClicks}</div></div>
                <div className="border-border rounded-lg border p-3"><span className="text-muted-foreground text-[10px] font-bold uppercase">Unique Conversion</span><div className="text-xl font-bold font-mono mt-1 text-foreground">{Math.floor(simulatedClicks * 0.74)}</div></div>
                <div className="border-border rounded-lg border p-3"><span className="text-muted-foreground text-[10px] font-bold uppercase">Average CTR</span><div className="text-xl font-bold font-mono mt-1 text-foreground">38.4%</div></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
