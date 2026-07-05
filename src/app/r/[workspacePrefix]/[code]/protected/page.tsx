"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { verifyLinkPassword } from "@/actions/links";

export default function ProtectedLinkPage() {
  const params = useParams();
  const workspacePrefix = params?.workspacePrefix as string;
  const code = params?.code as string;
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await verifyLinkPassword(workspacePrefix, code, password);
      if (res.success) {
        window.location.href = `/r/${workspacePrefix}/${code}`;
      } else {
        toast.error(
          res.error === "INCORRECT_PASSWORD"
            ? "Incorrect password"
            : "Authentication failed"
        );
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-4">
      <div className="border-border bg-card w-full max-w-sm space-y-6 rounded-2xl border p-6 text-center shadow-xl">
        <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl">
          <Lock className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Encrypted Link</h2>
          <p className="text-muted-foreground text-xs">
            This target destination is protected by access codes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            placeholder="Type password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-center text-sm outline-hidden"
          />
          <Button
            type="submit"
            disabled={pending}
            className="w-full cursor-pointer"
          >
            {pending ? "Unlocking..." : "Unlock Destination"}
          </Button>
        </form>
      </div>
    </div>
  );
}
