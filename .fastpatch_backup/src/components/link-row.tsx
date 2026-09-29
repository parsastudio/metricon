"use client";

import * as React from "react";
import {
  Calendar,
  Key,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  QrCode,
  FlaskConical,
  WifiOff,
} from "lucide-react";
import { LinkItem } from "@/lib/validations";
import { motion } from "framer-motion";

interface LinkRowProps {
  link: LinkItem;
  workspacePrefix: string;
  isPro: boolean;
  origin: string;
  copiedId: string | null;
  onCopy: (shortCode: string, linkId: string) => void;
  onToggleActive: (linkId: string, currentStatus: boolean) => void;
  onSelectQr: (url: string, title: string) => void;
  onSelectEdit: (link: LinkItem) => void;
  onSelectSimulator: (link: LinkItem) => void;
  onDelete: (linkId: string) => void;
}

export function LinkRow({
  link,
  workspacePrefix,
  isPro,
  origin,
  copiedId,
  onCopy,
  onToggleActive,
  onSelectQr,
  onSelectEdit,
  onSelectSimulator,
  onDelete,
}: LinkRowProps) {
  const isOptimistic = link.id.startsWith("optimistic-");

  return (
    <motion.div
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
            {link.password && <Key className="text-primary size-3" />}
            {link.expiresAt && <Calendar className="text-primary size-3" />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-primary font-bold">
              /r/{workspacePrefix}/{link.shortCode}
            </span>
            <button
              onClick={() => onCopy(link.shortCode, link.id)}
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded-sm p-0.5 transition-colors"
            >
              {copiedId === link.id ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
          <span className="text-muted-foreground hidden sm:inline">|</span>
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
            {!link.iosUrl && !link.androidUrl && !link.geoRouting && (
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
            onClick={() => onToggleActive(link.id, link.isActive)}
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
            onClick={() => onSelectSimulator(link)}
            title="Simulator / Test Scenarios"
            className="text-primary hover:bg-primary/10 cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <FlaskConical className="size-4" />
          </button>
          <button
            onClick={() =>
              onSelectQr(
                `${origin || "https://metricon.co"}/r/${workspacePrefix}/${link.shortCode}`,
                link.title || "Campaign Link"
              )
            }
            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
            title="Download QR Code"
          >
            <QrCode className="size-4" />
          </button>
          <button
            onClick={() => onSelectEdit(link)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
