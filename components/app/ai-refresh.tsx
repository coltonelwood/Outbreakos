"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function AIRefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh: true,
        intent: "briefing",
        user: "refresh dashboard briefing",
      }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
      <RefreshCw className={busy ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
      {busy ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
