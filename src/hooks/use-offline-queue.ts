import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { get, set, del } from "idb-keyval";
import { LinkItem } from "@/lib/validations";

interface PendingAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  payload: Record<string, unknown>;
}

export function useOfflineQueue(
  workspaceId: string,
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>,
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
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const syncQueue = useCallback(async () => {
    try {
      const queue = await get<PendingAction[]>(`sync_queue_${workspaceId}`);
      if (!queue || queue.length === 0) return;
      const remainingQueue: PendingAction[] = [];
      const unrecoverableErrors = [
        "LIMIT_REACHED",
        "SHORT_CODE_EXISTS",
        "FORBIDDEN",
        "RESERVED_SHORT_CODE",
        "LINK_NOT_FOUND",
        "WORKSPACE_NOT_FOUND",
      ];

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
            if (res.error && unrecoverableErrors.includes(res.error)) {
              toast.error(
                `Offline action discarded: ${res.error.replace(/_/g, " ")}`
              );
              if (action.type === "CREATE") {
                const tempShortCode = action.payload.shortCode as string;
                setLinks((prev) => {
                  const next = prev.filter(
                    (l) =>
                      !(
                        l.id.startsWith("optimistic-") &&
                        l.shortCode === tempShortCode
                      )
                  );
                  set(`links_cache_${workspaceId}`, next).catch(() => {});
                  return next;
                });
              }
            } else {
              remainingQueue.push(action);
            }
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
  }, [workspaceId, actions, setLinks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const online = navigator.onLine;
    setIsOnline(online);

    if (online) {
      syncQueue();
    }

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

  return {
    isOnline,
    queueAction,
    syncQueue,
  };
}
