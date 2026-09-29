"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LinkItem } from "@/lib/validations";
import {
  Smartphone,
  Globe,
  Lock,
  ExternalLink,
  Laptop,
  Layers,
  FlaskConical,
} from "lucide-react";

interface RedirectSimulatorDialogProps {
  link: LinkItem | null;
  workspacePrefix: string;
  origin: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RedirectSimulatorDialog({
  link,
  workspacePrefix,
  origin,
  isOpen,
  onClose,
}: RedirectSimulatorDialogProps) {
  if (!link) return null;

  const baseUrl = `${origin || "http://localhost:3000"}/r/${workspacePrefix}/${link.shortCode}`;

  const openSimulated = (params: string) => {
    const target = params ? `${baseUrl}?${params}` : baseUrl;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-bold">
              Redirect Routing Simulator
            </h3>
            <p className="text-muted-foreground text-xs">
              Test dynamic headers, device routing, and geo-scopes in 1-click.
            </p>
          </div>
        </div>

        <div className="bg-muted/40 border-border/60 rounded-lg border p-3 font-mono text-xs">
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">
            Target Code
          </span>
          <span className="text-primary font-bold">
            /r/{workspacePrefix}/{link.shortCode}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
            Available Test Scenarios
          </span>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => openSimulated("")}
              className="border-border bg-card hover:bg-muted flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Laptop className="size-4 text-muted-foreground" />
                Standard Desktop Route
              </span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </button>

            {link.iosUrl && (
              <button
                onClick={() => openSimulated("__device=Mobile")}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-between rounded-lg border p-2.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="size-4" />
                  Simulate Apple iOS Device
                </span>
                <span className="text-[10px] opacity-75 font-mono">apps.apple.com ➔</span>
              </button>
            )}

            {link.androidUrl && (
              <button
                onClick={() => openSimulated("__device=Mobile")}
                className="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between rounded-lg border p-2.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="size-4" />
                  Simulate Android Device
                </span>
                <span className="text-[10px] opacity-75 font-mono">play.google.com ➔</span>
              </button>
            )}

            {link.geoRouting && Object.keys(link.geoRouting).map((country) => (
              <button
                key={country}
                onClick={() => openSimulated(`__country=${country}`)}
                className="border-border bg-card hover:bg-muted flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  Simulate {country} Visitor Traffic
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {country} Target ➔
                </span>
              </button>
            ))}

            {link.password && (
              <div className="border-border/60 bg-muted/30 flex items-center justify-between rounded-lg border p-2.5 text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="size-4 text-amber-500" />
                  Protected Link Password:
                </span>
                <span className="bg-background border-border rounded px-2 py-0.5 font-mono font-bold text-amber-500 border select-all">
                  demo123
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close Simulator
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
