"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { IS_DEMO_MODE } from "@/core/config";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sentSuccess, setSentSuccess] = React.useState(false);

  const errorType = searchParams?.get("error");

  React.useEffect(() => {
    if (errorType === "expired_token") {
      toast.error("Your authorization link has expired or is invalid.");
    } else if (errorType === "missing_token") {
      toast.error("Security token was missing.");
    }
  }, [errorType]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const result = await loginUser(email);
      if (result.success) {
        if (result.isDemo && result.defaultWorkspaceSlug) {
          toast.success("Demo sandbox initialized instantly!");
          router.push(`/dashboard/${result.defaultWorkspaceSlug}`);
        } else {
          setSentSuccess(true);
          toast.success("Security access link dispatched to your email");
        }
      }
    } catch {
      toast.error("Failed to prepare authorization challenge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-border bg-card w-full max-w-sm space-y-6 rounded-2xl border p-6 shadow-xl">
      <div className="space-y-2 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl shadow-inner">
          <Sparkles className="size-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Metricon</h2>
        <p className="text-muted-foreground text-xs">
          {IS_DEMO_MODE
            ? "Sandbox mode is ACTIVE. Type any email to enter instantly."
            : "Enter your email for secure tokenized passwordless entry."}
        </p>
      </div>

      {sentSuccess ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Check your inbox</h3>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              An active link containing verification markers has been
              successfully delivered to{" "}
              <span className="text-foreground font-semibold">{email}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSentSuccess(false)}
            className="w-full text-xs"
          >
            Back to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border focus:border-primary placeholder:text-muted-foreground/70 w-full rounded-md border bg-transparent py-1.5 pr-3 pl-9 text-sm outline-hidden"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer"
          >
            {loading
              ? "Preparing Entry..."
              : IS_DEMO_MODE
                ? "Access Demo Instantly"
                : "Continue with Email"}
          </Button>

          {IS_DEMO_MODE && (
            <div className="border-primary/20 bg-primary/5 text-primary flex items-start gap-2 rounded-lg p-3 text-[10px] leading-normal">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Testing Sandbox Enabled: Click above to test complete platform
                actions without waiting for Resend mail challenges.
              </span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="from-background via-muted/50 to-background flex flex-1 items-center justify-center bg-radial p-4">
      <React.Suspense
        fallback={
          <div className="border-border bg-card flex w-full max-w-sm items-center justify-center rounded-2xl border p-12 shadow-xl">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        }
      >
        <AuthContent />
      </React.Suspense>
    </div>
  );
}
