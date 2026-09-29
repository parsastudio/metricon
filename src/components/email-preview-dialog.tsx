"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from "lucide-react";

interface EmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  loading: boolean;
  workspaceName: string;
}

export function EmailPreviewDialog({
  isOpen,
  onClose,
  htmlContent,
  loading,
  workspaceName,
}: EmailPreviewDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Mail className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Email Digest HTML Preview
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Automated weekly performance dispatch for {workspaceName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 bg-white p-2 min-h-[360px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-4 animate-spin text-primary" />
              Rendering HTML email template...
            </div>
          ) : (
            <iframe
              srcDoc={htmlContent}
              title="Email Digest Preview"
              className="w-full h-[400px] border-0 rounded"
              sandbox="allow-same-origin"
            />
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close Preview
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
