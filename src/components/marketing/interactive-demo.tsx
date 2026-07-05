"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Smartphone,
  Globe,
  BarChart3,
  RotateCcw,
} from "lucide-react";

export function InteractiveDemo() {
  const [url, setUrl] = React.useState("");
  const [isShortened, setIsShortened] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"targeting" | "telemetry">(
    "targeting"
  );
  const [simulatedClicks, setSimulatedClicks] = React.useState(142);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isShortened) return;
    const interval = setInterval(() => {
      setSimulatedClicks((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isShortened]);

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsShortened(true);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("metricon.co/r/premium/promo");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setUrl("");
    setIsShortened(false);
    setSimulatedClicks(142);
  };

  return (
    <div className="border-border/60 bg-card/60 mx-auto mt-16 max-w-3xl rounded-2xl border p-6 shadow-2xl backdrop-blur-md">
      <div className="border-border/40 mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-2.5 rounded-full bg-red-500" />
          <div className="flex size-2.5 rounded-full bg-yellow-500" />
          <div className="flex size-2.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground ml-2 font-mono text-[11px]">
            metricon-interactive-sandbox.sh
          </span>
        </div>
        <div className="bg-muted/60 text-primary flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
          <Sparkles className="size-3" />
          LIVE PREVIEW
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isShortened ? (
          <motion.form
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleShorten}
            className="space-y-4"
          >
            <div className="text-left">
              <h4 className="text-foreground text-sm font-bold">
                Paste your destination URL
              </h4>
              <p className="text-muted-foreground text-[11px]">
                Experience lightning-fast redirection architecture in action.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                required
                placeholder="https://yourwebsite.com/unoptimized-long-campaign-link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border-border bg-background/50 focus:border-primary flex-1 rounded-lg border px-4 py-2 text-xs outline-hidden transition-all"
              />
              <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="border-primary-foreground size-3 animate-spin rounded-full border-2 border-t-transparent" />
                    Optimizing...
                  </span>
                ) : (
                  <>
                    Shorten URL <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="sandbox-analytics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-muted/40 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Generated Link
                </span>
                <div className="text-primary font-mono text-sm font-semibold">
                  metricon.co/r/premium/promo
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="border-border bg-card hover:bg-muted flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="size-3.5 text-green-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border p-1.5 transition-colors"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            </div>

            <div className="border-border/40 flex gap-2 border-b pb-px">
              <button
                type="button"
                onClick={() => setActiveTab("targeting")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "targeting"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <Globe className="size-3.5" /> Dynamic Targeting
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "telemetry"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <BarChart3 className="size-3.5" /> Live Telemetry
              </button>
            </div>

            <div className="min-h-40">
              {activeTab === "targeting" ? (
                <div className="grid grid-cols-1 gap-3 text-left md:grid-cols-2">
                  <div className="border-border bg-background/30 rounded-lg border p-3.5">
                    <div className="text-foreground mb-2 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="text-primary size-3.5" /> iOS /
                        Android Routes
                      </span>
                      <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-[9px] font-bold">
                        PRO
                      </span>
                    </div>
                    <div className="text-muted-foreground space-y-1.5 font-mono text-[11px]">
                      <div>
                        iOS Device ➔{" "}
                        <span className="text-foreground">
                          apps.apple.com/app-id
                        </span>
                      </div>
                      <div>
                        Android Device ➔{" "}
                        <span className="text-foreground">
                          play.google.com/store-id
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-border bg-background/30 rounded-lg border p-3.5">
                    <div className="text-foreground mb-2 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Globe className="text-primary size-3.5" /> Geographical
                        Filters
                      </span>
                      <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-[9px] font-bold">
                        PRO
                      </span>
                    </div>
                    <div className="text-muted-foreground space-y-1.5 font-mono text-[11px]">
                      <div>
                        United Kingdom (UK) ➔{" "}
                        <span className="text-foreground">co.uk/store</span>
                      </div>
                      <div>
                        United States (US) ➔{" "}
                        <span className="text-foreground">
                          com/global-store
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
                    <div className="border-border bg-background/30 rounded-lg border p-3.5">
                      <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        Simulated Clicks
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-foreground font-mono text-xl font-bold">
                          {simulatedClicks}
                        </span>
                        <span className="inline-flex size-2 animate-ping rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="border-border bg-background/30 rounded-lg border p-3.5">
                      <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        Unique Conversion
                      </span>
                      <div className="text-foreground mt-1 font-mono text-xl font-bold">
                        {Math.floor(simulatedClicks * 0.74)}
                      </div>
                    </div>

                    <div className="border-border bg-background/30 rounded-lg border p-3.5">
                      <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        Average CTR
                      </span>
                      <div className="text-foreground mt-1 font-mono text-xl font-bold">
                        38.4%
                      </div>
                    </div>
                  </div>

                  <div className="border-border/80 bg-background/10 rounded-lg border p-3 text-left">
                    <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
                      Simulated Click Stream (Real-Time)
                    </span>
                    <div className="divide-border/30 mt-2 divide-y">
                      <div className="text-muted-foreground flex justify-between py-1.5 font-mono text-[10px]">
                        <span>🇬🇧 London, United Kingdom</span>
                        <span>
                          Chrome / Desktop ➔{" "}
                          <span className="text-emerald-500">
                            Redirected 2s ago
                          </span>
                        </span>
                      </div>
                      <div className="text-muted-foreground flex justify-between py-1.5 font-mono text-[10px]">
                        <span>🇺🇸 New York, United States</span>
                        <span>
                          Safari / iOS ➔{" "}
                          <span className="text-emerald-500">
                            Redirected 8s ago
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Button({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={`bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-5 py-2 text-xs font-bold transition-all disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
