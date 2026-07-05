"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface BillingSuccessAlertProps {
  type: "stripe" | "sandbox" | "downgrade";
}

export function BillingSuccessAlert({ type }: BillingSuccessAlertProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  const title =
    type === "downgrade" ? "Plan Downgraded" : "Workspace Upgraded to Pro";

  const description =
    type === "downgrade"
      ? "Your workspace is now on the Free tier limits."
      : "Your workspace has been successfully provisioned with unlimited links, advanced geotargeting, and live dynamic analytics.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative mb-6 flex items-start gap-4 rounded-xl border p-5 shadow-sm ${
          type === "downgrade"
            ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
            : "border-primary/20 bg-primary/5 text-primary"
        }`}
      >
        <div className="rounded-lg bg-current/10 p-2">
          <Sparkles className="size-5" />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="text-foreground text-sm font-bold tracking-tight">
            {title}
          </h4>
          <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
            {description}
          </p>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1 transition-colors"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
