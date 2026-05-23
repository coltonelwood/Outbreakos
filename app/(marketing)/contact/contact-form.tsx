"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))]" />
        <h3 className="mt-3 text-lg font-semibold">Request received.</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          We'll be in touch within one business day. Active deployments are
          routed to on-call deployment leads within 4 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="org">Organization</Label>
          <Input id="org" name="org" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="e.g. Director of Operations" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="audience">I am from</Label>
          <Select id="audience" name="audience" defaultValue="airport">
            <option value="airport">Airport / point of entry</option>
            <option value="mining">Mining / industrial operator</option>
            <option value="hospital">Hospital / clinic</option>
            <option value="government">Government / ministry</option>
            <option value="ngo">NGO / multilateral</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intent">Request type</Label>
          <Select id="intent" name="intent" defaultValue="demo">
            <option value="demo">Product demo</option>
            <option value="pilot">Pilot deployment</option>
            <option value="emergency">Emergency deployment (active situation)</option>
            <option value="enterprise">Enterprise / national rollout</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">What are you trying to solve?</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      <p className="text-xs text-muted-foreground">
        By submitting you agree to our processing of this enquiry. We do not
        share lead data with third parties.
      </p>
      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
