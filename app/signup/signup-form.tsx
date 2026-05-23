"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!r.ok) {
      setErr("Signup failed. Try again or use a demo account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="org">Organization name</Label>
        <Input id="org" name="org" required placeholder="Ministry of Health, Acme Mining…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mode">Operating mode</Label>
        <Select id="mode" name="mode" defaultValue="standard">
          <option value="standard">Standard</option>
          <option value="airport_poe">Airport Point-of-Entry</option>
          <option value="mining_site">Mining Site Protection</option>
          <option value="gov_emergency">Government Emergency Operations</option>
          <option value="ngo_field">NGO Field Response</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Your full name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={4} />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        In demo mode signup auto-attaches to the seeded demo organization so the
        product is immediately useful.
      </p>
    </form>
  );
}
