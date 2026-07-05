"use client";

import * as React from "react";

export function useOrigin(): string {
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  return origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
