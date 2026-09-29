"use client";

import * as React from "react";

const emptySubscribe = () => () => {};

export function useOrigin(): string {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
}
