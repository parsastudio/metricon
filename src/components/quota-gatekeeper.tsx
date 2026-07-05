"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BillingUpgradeButton } from "@/components/billing-upgrade-button";
import { Sparkles, Flame, Star, ShieldAlert } from "lucide-react";

interface QuotaGatekeeperProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function QuotaGatekeeper({
  isOpen,
  onClose,
  workspaceId,
}: QuotaGatekeeperProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
            <Sparkles className="size-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight">
            Unlock Metricon Pro Capability
          </h3>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            You have reached a Free Tier system boundary. Scale up to enterprise
            routing controls.
          </p>
        </div>

        <div className="border-border/60 bg-muted/40 grid grid-cols-1 gap-4 rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-primary/20 text-primary rounded p-1">
              <Flame className="size-3.5" />
            </div>
            <div>
              <span className="text-foreground block font-semibold">
                Dynamic Device Targeting
              </span>
              <span className="text-muted-foreground block text-[10px]">
                Route iOS & Android users to dedicated destination links.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-primary/20 text-primary rounded p-1">
              <Star className="size-3.5" />
            </div>
            <div>
              <span className="text-foreground block font-semibold">
                Geographic Routing filters
              </span>
              <span className="text-muted-foreground block text-[10px]">
                Pinpoint redirects based on exact country origin.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-primary/20 text-primary rounded p-1">
              <ShieldAlert className="size-3.5" />
            </div>
            <div>
              <span className="text-foreground block font-semibold">
                Security Token Gates & Passwords
              </span>
              <span className="text-muted-foreground block text-[10px]">
                Lock short codes or schedule lifetime expiration limits.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <BillingUpgradeButton workspaceId={workspaceId} currentPlan="free" />
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full cursor-pointer text-xs"
          >
            Continue on Free Tier
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
