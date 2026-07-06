"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { verifyLinkPassword } from "@/actions/links-security";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, ShieldAlert, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PasswordFormProps {
  workspacePrefix: string;
  code: string;
  title: string;
}

export function PasswordForm({
  workspacePrefix,
  code,
  title,
}: PasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await verifyLinkPassword(workspacePrefix, code, password);
      if (res.success) {
        toast.success("Link unlocked successfully");
        router.push(`/r/${workspacePrefix}/${code}`);
        router.refresh();
      } else {
        if (res.error === "INCORRECT_PASSWORD") {
          setError("The password entered is incorrect.");
          toast.error("Incorrect password");
        } else if (
          res.error === "INCORRECT_PASSWORD_LOCKED" ||
          res.error === "LOCKED_OUT"
        ) {
          setError(
            "Too many failed attempts. You are locked out for 15 minutes."
          );
          toast.error("Brute-force protection active. Locked out.");
        } else {
          setError("An error occurred during verification.");
          toast.error("Verification failed");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-2xl backdrop-blur-md sm:p-8"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-2xl">
            <Lock className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Password Protected Link
          </h2>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            Access to{" "}
            <span className="text-foreground font-semibold">{title}</span>{" "}
            requires authentication credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border focus:border-primary placeholder:text-muted-foreground/70 w-full rounded-lg border bg-transparent py-2 pr-3 pl-9 text-sm outline-hidden transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-xs font-medium"
            >
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="border-primary-foreground size-3 animate-spin rounded-full border-2 border-t-transparent" />
                Unlocking...
              </span>
            ) : (
              <>
                Unlock Link
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
