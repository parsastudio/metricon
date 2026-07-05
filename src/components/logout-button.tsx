"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      toast.success("Successfully logged out");
      router.push("/auth");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive cursor-pointer rounded-lg p-1.5 transition-colors disabled:opacity-50"
      aria-label="Log out"
    >
      <LogOut className="size-4" />
    </button>
  );
}
