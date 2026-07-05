"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard bounds boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 text-destructive mb-4 flex size-14 items-center justify-center rounded-full">
        <AlertCircle className="size-7" />
      </div>

      <div className="mb-6 max-w-md space-y-2">
        <h3 className="text-foreground text-lg font-bold">Telemetry Failure</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          An error occurred while loading this workspace layout. This could be
          due to a brief database connection timeout or network interruption.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="cursor-pointer text-xs"
        >
          Reload Window
        </Button>
        <Button
          onClick={() => reset()}
          className="cursor-pointer gap-2 text-xs"
        >
          <RefreshCcw className="size-3.5" />
          Retry Request
        </Button>
      </div>
    </div>
  );
}
