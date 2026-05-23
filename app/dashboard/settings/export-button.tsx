"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton() {
  async function onExport() {
    const r = await fetch("/api/export");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outbreakos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button onClick={onExport}>
      <Download className="h-4 w-4" /> Export org data (JSON)
    </Button>
  );
}
