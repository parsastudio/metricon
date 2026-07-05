import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { get, set, del } from "idb-keyval";
import { LinkItem } from "@/lib/validations";

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
    ) => Promise<{ success: boolean; error?: string }>;
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
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const syncQueue = useCallback(async () => {
    try {
      const queue = await get<PendingAction[]>(`sync_queue_${workspaceId}`);
      if (!queue || queue.length === 0) return;
      const remainingQueue: PendingAction[] = [];
      for (const action of queue) {
        try {
          let res: { success: boolean; error?: string } = { success: false };
          if (action.type === "CREATE") {
            res = await actions.onCreate(action.payload);
          } else if (action.type === "UPDATE") {
            res = await actions.onUpdate(action.payload);
          } else if (action.type === "DELETE") {
            res = await actions.onDelete(action.payload.linkId as string);
          } else if (action.type === "TOGGLE") {
            res = await actions.onToggle(
              action.payload.linkId as string,
              action.payload.isActive as boolean
            );
          }
          if (!res.success) {
            remainingQueue.push(action);
          }
        } catch {
          remainingQueue.push(action);
        }
      }
      if (remainingQueue.length === 0) {
        await del(`sync_queue_${workspaceId}`);
        toast.success("All offline interactions synchronized with cloud!");
      } else {
        await set(`sync_queue_${workspaceId}`, remainingQueue);
      }
    } catch {
      await del(`sync_queue_${workspaceId}`);
    }
  }, [workspaceId, actions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Online status restored. Aligning records...");
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        "Network connection disrupted. Safe local-first offline state enabled."
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [workspaceId, syncQueue]);

  useEffect(() => {
    async function loadCache() {
      try {
        const cached = await get<LinkItem[]>(`links_cache_${workspaceId}`);
        if (cached) {
          setLinks(cached);
        } else {
          setLinks(initialLinks);
        }
      } catch {
        setLinks(initialLinks);
      }
    }
    loadCache();
  }, [workspaceId, initialLinks]);

  const queueAction = useCallback(
    async (action: PendingAction) => {
      try {
        const queue =
          (await get<PendingAction[]>(`sync_queue_${workspaceId}`)) || [];
        await set(`sync_queue_${workspaceId}`, [...queue, action]);
      } catch {}
    },
    [workspaceId]
  );

  const createLinkOffline = useCallback(
    async (data: Record<string, unknown>) => {
      const tempId = `optimistic-${crypto.randomUUID()}`;
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
        l.id === linkId ? { ...l, isActive } : l
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
