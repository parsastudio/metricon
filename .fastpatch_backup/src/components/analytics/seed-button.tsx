"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { seedMockData } from "@/actions/analytics";
import { Button } from "@/components/ui/button";
import { Database, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SeedButtonProps {
  workspaceId: string;
}

export function SeedButton({ workspaceId }: SeedButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedMockData(workspaceId);
      if (res.success) {
        toast.success("Mock analytics and campaigns injected successfully!");
        router.refresh();
      } else {
        toast.error(
          "Failed to inject demo data. Check your workspace access role."
        );
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      variant="outline"
      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer gap-2 shadow-xs transition-all"
    >
      <Database className="size-4" />
      {loading ? "Generating Demo..." : "Inject Sandbox Demo Data"}
    </Button>
  );
}
