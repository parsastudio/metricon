"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ban, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function LinkExpiredPage() {
  return (
    <div className="from-background via-muted/30 to-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="border-border/80 bg-card/60 max-w-sm rounded-2xl border p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
          <Ban className="size-7" />
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight">
          Link Invalidated
        </h2>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          The requested redirect is either expired, inactive, or has exceeded
          its allowed Click limit boundaries configured by the marketing team.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/" passHref className="flex-1">
            <Button
              variant="outline"
              className="w-full cursor-pointer gap-1.5 text-xs"
            >
              <Home className="size-3.5" />
              Base Portal
            </Button>
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="border-border bg-card hover:bg-muted flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
