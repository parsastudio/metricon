"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { rotateApiKey } from "@/actions/auth";
import { toast } from "sonner";

interface ApiCredentialsProps {
  workspaceId: string;
  initialApiKey: string;
  origin: string;
}

export function ApiCredentialsCard({
  workspaceId,
  initialApiKey,
  origin,
}: ApiCredentialsProps) {
  const [showKey, setShowKey] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [hasNewKey, setHasNewKey] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const displayKey = hasNewKey
    ? apiKey
    : "mc_live_••••••••••••••••••••••••••••••••";

  const listUrl = `curl -X GET "${origin}/api/v1/links?workspaceId=${workspaceId}" \\
  -H "Authorization: Bearer ${hasNewKey ? apiKey : "YOUR_API_KEY"}"`;

  const createUrl = `curl -X POST "${origin}/api/v1/links" \\
  -H "Authorization: Bearer ${hasNewKey ? apiKey : "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspaceId": "${workspaceId}",
    "originalUrl": "https://example.com",
    "shortCode": "custom-campaign"
  }'`;

  const copyToClipboard = (text: string, id: string) => {
    if (id === "token" && !hasNewKey) {
      toast.error("Please rotate your API key first to copy the raw token.");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Copied to clipboard successfully");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRotateKey = async () => {
    setLoading(true);
    try {
      const res = await rotateApiKey();
      if (res.success && res.apiKey) {
        setApiKey(res.apiKey);
        setHasNewKey(true);
        setShowKey(true);
        toast.success(
          "API key successfully regenerated! Make sure to copy it now."
        );
      }
    } catch {
      toast.error("Failed to regenerate API credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="border-border bg-muted/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">
              Bearer Secret:
            </span>
            <span className="font-mono font-bold">
              {showKey ? displayKey : "••••••••••••••••••••••••••••••••"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showKey ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
              <button
                onClick={() => copyToClipboard(displayKey, "token")}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {copiedCode === "token" ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleRotateKey}
            disabled={loading}
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Rotate Key
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/40 border-border/60 rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground flex items-center gap-1.5">
              <Terminal className="text-primary size-4" /> Fetch All Links (GET)
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
              Copy Command
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-black p-3.5 font-mono text-[11px] text-slate-300">
            {listUrl}
          </pre>
        </div>

        <div className="bg-muted/40 border-border/60 rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground flex items-center gap-1.5">
              <Terminal className="text-primary size-4" /> Create Shortened Link
              (POST)
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
              Copy Command
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-black p-3.5 font-mono text-[11px] text-slate-300">
            {createUrl}
          </pre>
        </div>
      </div>
    </div>
  );
}
