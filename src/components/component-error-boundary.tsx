"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ComponentErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Widget boundary error context:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border-border/60 bg-destructive/5 flex min-h-40 flex-col items-center justify-center rounded-xl border p-6 text-center">
          <AlertTriangle className="text-destructive size-6" />
          <h4 className="text-foreground mt-2 text-xs font-semibold">
            Widget Render Failure
          </h4>
          <p className="text-muted-foreground mt-1 max-w-xs text-[10px] leading-relaxed">
            The layout engine failed to build this module dynamically.
          </p>
          <Button
            size="xs"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 cursor-pointer gap-1"
          >
            <RefreshCcw className="size-3" />
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
