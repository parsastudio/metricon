import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";

export default function LinkExpiredPage() {
  return (
    <div className="bg-background flex flex-1 flex-col items-center justify-center space-y-5 p-4 text-center">
      <div className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
        <Ban className="size-8" />
      </div>
      <div className="max-w-xs space-y-1">
        <h2 className="text-foreground text-xl font-bold tracking-tight">
          Link Invalidated
        </h2>
        <p className="text-muted-foreground text-xs">
          The requested redirect is either expired, inactive, or has exceeded
          its allowed click boundaries.
        </p>
      </div>
      <Link href="/" passHref>
        <Button variant="outline" className="cursor-pointer">
          Return to Metricon
        </Button>
      </Link>
    </div>
  );
}
