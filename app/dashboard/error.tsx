"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this should go to Sentry / your error tracker.
    console.error("[dashboard]", error);
  }, [error]);
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center space-y-3">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        We caught an error rendering this page. The operations team has been
        notified. You can retry, or head back to the overview.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Reference: <code>{error.digest}</code>
        </p>
      )}
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={reset}>Retry</Button>
        <a href="/dashboard">
          <Button>Back to overview</Button>
        </a>
      </div>
    </div>
  );
}
