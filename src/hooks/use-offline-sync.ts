"use client";

import { useState, useEffect, useCallback } from "react";
import { set, get } from "idb-keyval";
import { LinkItem } from "@/lib/validations";
import { useOfflineQueue } from "./use-offline-queue";

interface PendingAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  payload: Record<string, unknown>;
}

export function useOfflineSync(
  workspaceId: string,
  initialLinks: LinkItem[],
  actions: {
    onCreate: (
      data: Record<string, unknown>
    ) => Promise<{ success: boolean; error?: string; linkId?: string }>;
    onUpdate: (
      data: Record<string, unknown>
    ) => Promise<{ success: boolean; error?: string }>;
    onDelete: (linkId: string) => Promise<{ success: boolean; error?: string }>;
    onToggle: (
      linkId: string,
      isActive: boolean
    ) => Promise<{ success: boolean; error?: string }>;
  }
) {
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);

  const { isOnline, queueAction } = useOfflineQueue(
    workspaceId,
    setLinks,
    actions
  );

  useEffect(() => {
    async function loadCache() {
      try {
        if (navigator.onLine) {
          setLinks(initialLinks);
          await set(`links_cache_${workspaceId}`, initialLinks);
        } else {
          const cached = await get<LinkItem[]>(`links_cache_${workspaceId}`);
          if (cached) {
            setLinks(cached);
          } else {
            setLinks(initialLinks);
          }
        }
      } catch {
        setLinks(initialLinks);
      }
    }
    loadCache();
  }, [workspaceId, initialLinks]);

  const createLinkOffline = useCallback(
    async (data: Record<string, unknown>) => {
      const tempId = `optimistic-${crypto.randomUUID()}`;
      const nowString = new Date().toISOString();
      const newLink: LinkItem = {
        id: tempId,
        workspaceId: workspaceId,
        shortCode: data.shortCode as string,
        originalUrl: data.originalUrl as string,
        title: (data.title as string) || (data.originalUrl as string),
        isActive: true,
        password: (data.password as string) || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : null,
        clicksCount: 0,
        iosUrl: (data.iosUrl as string) || null,
        androidUrl: (data.androidUrl as string) || null,
        desktopUrl: (data.desktopUrl as string) || null,
        geoRouting: (data.geoRouting as Record<string, string>) || null,
        createdAt: nowString,
        updatedAt: nowString,
      };
      const updated = [newLink, ...links];
      setLinks(updated);
      await set(`links_cache_${workspaceId}`, updated);

      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: "CREATE",
        payload: data,
      };
      if (navigator.onLine) {
        try {
          const res = await actions.onCreate(data);
          if (!res.success) throw new Error();
          if (res.success && res.linkId) {
            const realId = res.linkId;
            setLinks((prev) => {
              const next = prev.map((l) =>
                l.id === tempId ? { ...l, id: realId } : l
              );
              set(`links_cache_${workspaceId}`, next).catch(() => {});
              return next;
            });
          }
        } catch {
          await queueAction(action);
        }
      } else {
        await queueAction(action);
      }
    },
    [workspaceId, links, actions, queueAction]
  );

  const updateLinkOffline = useCallback(
    async (data: Record<string, unknown>) => {
      const updated = links.map((l) => {
        if (l.id === data.linkId) {
          return {
            ...l,
            originalUrl: (data.originalUrl as string) || l.originalUrl,
            title: (data.title as string) || l.title,
            password: (data.password as string) || l.password,
            expiresAt: data.expiresAt
              ? new Date(data.expiresAt as string)
              : l.expiresAt,
            iosUrl: (data.iosUrl as string) || l.iosUrl,
            androidUrl: (data.androidUrl as string) || l.androidUrl,
            geoRouting:
              (data.geoRouting as Record<string, string>) || l.geoRouting,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      });
      setLinks(updated);
      await set(`links_cache_${workspaceId}`, updated);

      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: "UPDATE",
        payload: data,
      };
      if (navigator.onLine) {
        try {
          const res = await actions.onUpdate(data);
          if (!res.success) throw new Error();
        } catch {
          await queueAction(action);
        }
      } else {
        await queueAction(action);
      }
    },
    [workspaceId, links, actions, queueAction]
  );

  const toggleLinkOffline = useCallback(
    async (linkId: string, isActive: boolean) => {
      const updated = links.map((l) =>
        l.id === linkId
          ? { ...l, isActive, updatedAt: new Date().toISOString() }
          : l
      );
      setLinks(updated);
      await set(`links_cache_${workspaceId}`, updated);

      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: "TOGGLE",
        payload: { linkId, isActive },
      };
      if (navigator.onLine) {
        try {
          const res = await actions.onToggle(linkId, isActive);
          if (!res.success) throw new Error();
        } catch {
          await queueAction(action);
        }
      } else {
        await queueAction(action);
      }
    },
    [workspaceId, links, actions, queueAction]
  );

  const deleteLinkOffline = useCallback(
    async (linkId: string) => {
      const updated = links.filter((l) => l.id !== linkId);
      setLinks(updated);
      await set(`links_cache_${workspaceId}`, updated);

      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: "DELETE",
        payload: { linkId },
      };
      if (navigator.onLine) {
        try {
          const res = await actions.onDelete(linkId);
          if (!res.success) throw new Error();
        } catch {
          await queueAction(action);
        }
      } else {
        await queueAction(action);
      }
    },
    [workspaceId, links, actions, queueAction]
  );

  return {
    links,
    isOnline,
    createLinkOffline,
    updateLinkOffline,
    toggleLinkOffline,
    deleteLinkOffline,
  };
}
