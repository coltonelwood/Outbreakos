"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={busy}>
      <LogOut className="h-4 w-4" /> {busy ? "Signing out…" : "Sign out everywhere"}
    </Button>
  );
}
