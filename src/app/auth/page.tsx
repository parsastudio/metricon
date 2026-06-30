"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const result = await loginUser(email);
      toast.success("Welcome back to Metricon!");
      router.push(`/dashboard/${result.defaultWorkspaceSlug}`);
    } catch {
      toast.error("Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="from-background via-muted/50 to-background flex flex-1 items-center justify-center bg-radial p-4">
      <div className="border-border bg-card w-full max-w-sm space-y-6 rounded-2xl border p-6 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl shadow-inner">
            <Sparkles className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Access Metricon</h2>
          <p className="text-muted-foreground text-xs">
            Enter your email for passwordless entry.
          </p>
        </div>

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
            {loading ? "Authorizing..." : "Continue with Email"}
          </Button>
        </form>
      </div>
    </div>
  );
}
