"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const QUICK_ACCOUNTS = [
  { label: "Demo Owner", email: "demo@outbreakos.io" },
  { label: "Health Officer", email: "ho@outbreakos.io" },
  { label: "Screener", email: "screener@outbreakos.io" },
  { label: "Viewer (investor demo)", email: "viewer@outbreakos.io" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@outbreakos.io");
  const [password, setPassword] = useState("demo");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!r.ok) {
      setErr("Sign-in failed. Try one of the demo accounts below.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo accounts (password: <code className="text-primary">demo</code>)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACCOUNTS.map((a) => (
              <button
                type="button"
                key={a.email}
                onClick={() => {
                  setEmail(a.email);
                  setPassword("demo");
                }}
                className="text-left rounded-md border border-border bg-muted/30 hover:bg-muted px-3 py-2 text-xs transition-colors"
              >
                <div className="font-medium">{a.label}</div>
                <div className="text-muted-foreground">{a.email}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
