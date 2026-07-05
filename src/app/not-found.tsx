"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowRight, Home, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="from-background via-muted/30 to-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="border-border/80 bg-card/60 max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="bg-primary/10 text-primary relative mx-auto flex size-16 items-center justify-center rounded-2xl">
          <HelpCircle className="size-8" />
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-primary relative inline-flex size-3 rounded-full" />
          </span>
        </div>

        <h2 className="mt-6 text-2xl font-extrabold tracking-tight">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          The requested URL does not map to any active campaign shortcode or
          system resource. Check for typographical errors or return to base
          workspace.
        </p>

        <div className="bg-muted/40 border-border/40 mt-6 rounded-lg border p-4 text-left">
          <span className="text-primary flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
            <Sparkles className="size-3" /> Quick Resolution Steps
          </span>
          <ul className="text-muted-foreground mt-2 space-y-1.5 text-[10px]">
            <li>• Ensure you are registered in the correct workspace.</li>
            <li>
              • Verify the routing vanity prefix inside the requested URL.
            </li>
            <li>
              • Confirm if the shortcode was expired or restricted by owner.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link href="/" passHref className="flex-1">
            <Button
              variant="outline"
              className="w-full cursor-pointer gap-2 text-xs"
            >
              <Home className="size-4" />
              Base Portal
            </Button>
          </Link>
          <Link href="/auth" passHref className="flex-1">
            <Button className="w-full cursor-pointer gap-2 text-xs">
              Dashboard
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
