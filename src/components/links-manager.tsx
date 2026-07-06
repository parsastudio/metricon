"use client";

import * as React from "react";
import { LinkCreator } from "./link-creator";
import { LinksTable } from "./links-table";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Wifi, WifiOff } from "lucide-react";
import { useOrigin } from "@/hooks/use-origin";
import { LinkItem } from "@/lib/validations";

interface LinksManagerProps {
  workspaceId: string;
  workspacePrefix: string;
  initialLinks: LinkItem[];
  isPro: boolean;
  onCreateLink: (data: {
    workspaceId: string;
    originalUrl: string;
    shortCode: string;
    title?: string;
    password?: string;
    expiresAt?: string;
    maxClicks?: number;
    iosUrl?: string;
    androidUrl?: string;
    desktopUrl?: string;
    geoRouting?: Record<string, string>;
  }) => Promise<{ success: boolean; error?: string; linkId?: string }>;
  onUpdateLink: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteLink: (
    linkId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onToggleActive: (
    linkId: string,
    isActive: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

export function LinksManager({
  workspaceId,
  workspacePrefix,
  initialLinks,
  isPro,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onToggleActive,
}: LinksManagerProps) {
  const origin = useOrigin();

  const {
    links,
    isOnline,
    createLinkOffline,
    updateLinkOffline,
    toggleLinkOffline,
    deleteLinkOffline,
  } = useOfflineSync(workspaceId, initialLinks, {
    onCreate: async (data) =>
      onCreateLink(
        data as {
          workspaceId: string;
          originalUrl: string;
          shortCode: string;
          title?: string;
          password?: string;
          expiresAt?: string;
          maxClicks?: number;
          iosUrl?: string;
          androidUrl?: string;
          desktopUrl?: string;
          geoRouting?: Record<string, string>;
        }
      ),
    onUpdate: async (data) => onUpdateLink(data),
    onDelete: async (linkId) => onDeleteLink(linkId),
    onToggle: async (linkId, isActive) => onToggleActive(linkId, isActive),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Workspace Links
            </h2>
            {isOnline ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Wifi className="size-3" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <WifiOff className="size-3" />
                OFFLINE SANDBOX
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            Manage your tracking, targeting & shortened codes.
          </p>
        </div>
        <LinkCreator
          workspaceId={workspaceId}
          isPro={isPro}
          onCreateLink={async (data) => {
            await createLinkOffline(data);
            return { success: true };
          }}
        />
      </div>

      <LinksTable
        workspaceId={workspaceId}
        workspacePrefix={workspacePrefix}
        initialLinks={links}
        isPro={isPro}
        origin={origin}
        onDelete={deleteLinkOffline}
        onToggleActive={toggleLinkOffline}
        onUpdateLink={updateLinkOffline}
      />
    </div>
  );
}
