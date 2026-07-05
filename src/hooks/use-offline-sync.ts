import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface OfflineLink {
  id: string;
  workspaceId: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  isActive: boolean;
  password?: string | null;
  expiresAt?: Date | null;
  clicksCount: number;
  iosUrl?: string | null;
  androidUrl?: string | null;
  desktopUrl?: string | null;
  geoRouting?: Record<string, string> | null;
}

interface PendingCreation {
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

export function useOfflineSync(
  workspaceId: string,
  initialLinks: OfflineLink[],
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
  }) => Promise<{ success: boolean; error?: string }>
) {
  const [links, setLinks] = useState<OfflineLink[]>(initialLinks);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored. Synchronizing offline queue...");
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        "You are currently offline. Local changes will sync when connection resumes."
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [workspaceId]);

  const syncQueue = useCallback(async () => {
    const queueRaw = localStorage.getItem(`sync_queue_${workspaceId}`);
    if (!queueRaw) return;
    try {
      const queue = JSON.parse(queueRaw) as PendingCreation[];
      if (queue.length === 0) return;
      const remainingQueue: PendingCreation[] = [];
      for (const item of queue) {
        try {
          const res = await onCreateLink(item);
          if (!res.success) {
            remainingQueue.push(item);
          }
        } catch {
          remainingQueue.push(item);
        }
      }
      localStorage.setItem(
        `sync_queue_${workspaceId}`,
        JSON.stringify(remainingQueue)
      );
      if (remainingQueue.length === 0) {
        toast.success("All offline campaign links synchronized successfully!");
      } else {
        toast.error(
          `${remainingQueue.length} offline links failed to sync. Will retry later.`
        );
      }
    } catch {
      localStorage.removeItem(`sync_queue_${workspaceId}`);
    }
  }, [workspaceId, onCreateLink]);

  useEffect(() => {
    const cached = localStorage.getItem(`links_cache_${workspaceId}`);
    if (cached) {
      try {
        setLinks(JSON.parse(cached));
      } catch {
        setLinks(initialLinks);
      }
    } else {
      setLinks(initialLinks);
    }
  }, [workspaceId, initialLinks]);

  const createLinkOffline = useCallback(
    async (data: PendingCreation) => {
      const tempId = `optimistic-${crypto.randomUUID()}`;
      const newLink: OfflineLink = {
        id: tempId,
        workspaceId: data.workspaceId,
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        title: data.title || data.originalUrl,
        isActive: true,
        password: data.password || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        clicksCount: 0,
        iosUrl: data.iosUrl || null,
        androidUrl: data.androidUrl || null,
        desktopUrl: data.desktopUrl || null,
        geoRouting: data.geoRouting || null,
      };
      setLinks((prev) => {
        const updated = [newLink, ...prev];
        localStorage.setItem(
          `links_cache_${workspaceId}`,
          JSON.stringify(updated)
        );
        return updated;
      });
      if (navigator.onLine) {
        try {
          const res = await onCreateLink(data);
          if (!res.success) {
            throw new Error(res.error);
          }
        } catch {
          const queueRaw = localStorage.getItem(`sync_queue_${workspaceId}`);
          const queue = queueRaw
            ? (JSON.parse(queueRaw) as PendingCreation[])
            : [];
          localStorage.setItem(
            `sync_queue_${workspaceId}`,
            JSON.stringify([...queue, data])
          );
        }
      } else {
        const queueRaw = localStorage.getItem(`sync_queue_${workspaceId}`);
        const queue = queueRaw
          ? (JSON.parse(queueRaw) as PendingCreation[])
          : [];
        localStorage.setItem(
          `sync_queue_${workspaceId}`,
          JSON.stringify([...queue, data])
        );
      }
    },
    [workspaceId, onCreateLink]
  );

  return {
    links,
    isOnline,
    createLinkOffline,
  };
}
