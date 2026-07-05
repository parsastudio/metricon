"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setLoading(true);
    try {
      const res = await createWorkspace(name, slug);
      toast.success("Workspace created successfully");
      router.push(`/dashboard/${res.slug}`);
      router.refresh();
    } catch {
      toast.error(
        "Failed to create workspace. The URL slug might already be taken."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="from-background via-muted/30 to-background flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="border-border/80 bg-card/60 w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Setup your workspace
          </h2>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            Every link, campaign, and analytical insight requires a dedicated
            organizational container.
          </p>
        </div>

        <form onSubmit={handleCreate} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Workspace Name
            </label>
            <div className="relative">
              <Building2 className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <input
                type="text"
                required
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-")
                  );
                }}
                className="border-border focus:border-primary placeholder:text-muted-foreground/50 w-full rounded-md border bg-transparent py-1.5 pr-3 pl-9 text-sm outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Workspace Slug URL
            </label>
            <div className="flex rounded-md shadow-xs">
              <span className="border-border bg-muted text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-xs select-none">
                /dashboard/
              </span>
              <input
                type="text"
                required
                placeholder="acme-corp"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
                  )
                }
                className="border-border focus:border-primary w-full rounded-r-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full cursor-pointer gap-2"
          >
            {loading ? "Creating workspace..." : "Create & Continue"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
