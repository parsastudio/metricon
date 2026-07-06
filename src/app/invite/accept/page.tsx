"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { acceptWorkspaceInvitation } from "@/actions/workspace-members";
import { toast } from "sonner";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle"
  );
  const [workspaceSlug, setWorkspaceSlug] = React.useState("");

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await acceptWorkspaceInvitation(token);
      if (res.success && res.slug) {
        setWorkspaceSlug(res.slug);
        setStatus("success");
        toast.success("Successfully joined the workspace!");
      } else {
        setStatus("error");
        if (res.error === "EMAIL_MISMATCH") {
          toast.error("Logged-in email does not match invitation email");
        } else if (res.error === "UNAUTHORIZED") {
          toast.error("Please log in first to accept this invitation");
        } else {
          toast.error("Invalid or expired invitation token.");
        }
      }
    } catch {
      setStatus("error");
      toast.error("Failed to accept invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-border bg-card w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl">
      <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
        <Sparkles className="size-5" />
      </div>

      {status === "idle" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Workspace Invitation</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You have been authorized to join an active workspace. Accept
              invitation below to verify and configure access.
            </p>
          </div>
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full cursor-pointer"
          >
            {loading ? "Joining..." : "Accept & Continue"}
          </Button>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Access Granted</h2>
            <p className="text-muted-foreground text-xs">
              Your credentials have been associated. Proceed to your dashboard.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/${workspaceSlug}`)}
            className="w-full cursor-pointer"
          >
            Go to Dashboard
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Authorization Failed</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              The security code has either been revoked, consumed, or exceeded
              its 24-hour expiration threshold.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full cursor-pointer"
          >
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <React.Suspense
        fallback={
          <div className="border-border bg-card flex w-full max-w-sm items-center justify-center rounded-2xl border p-12 shadow-xl">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        }
      >
        <AcceptInvitationContent />
      </React.Suspense>
    </div>
  );
}
