"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2 } from "lucide-react";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function ContactForm() {
  const search = useSearchParams();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [intentDefault, setIntentDefault] = useState("demo");

  useEffect(() => {
    // Pre-select intent from query (?intent=pilot/emergency/enterprise)
    const i = search?.get("intent");
    if (i && ["demo", "pilot", "emergency", "enterprise"].includes(i)) {
      setIntentDefault(i);
    }
  }, [search]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = Object.fromEntries(fd.entries()) as Record<string, string>;
    // Capture UTM + referrer client-side and bundle them into the payload.
    const utm: Record<string, string> = {};
    if (search) {
      for (const k of UTM_KEYS) {
        const v = search.get(k);
        if (v) utm[k] = v;
      }
    }
    if (typeof document !== "undefined" && document.referrer) {
      utm.referrer = document.referrer.slice(0, 500);
    }
    const r = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        source: data.source || "contact-form",
        utm,
      }),
    });
    setLoading(false);
    if (r.ok) {
      setSubmitted(true);
      toast("Request received — we'll be in touch within one business day.", "success");
    } else {
      toast("Couldn't submit the form. Please try again or email us directly.", "error");
    }
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
      {/* Honeypot — bots fill this; humans don't see it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
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
          <Input id="role" name="role" placeholder="e.g. Director of HSE" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="audience">I am from</Label>
          <Select id="audience" name="audience" defaultValue="mining">
            <option value="mining">Mining / industrial operator</option>
            <option value="airport">Airport / point of entry</option>
            <option value="hospital">Hospital / clinic</option>
            <option value="government">Government / ministry</option>
            <option value="ngo">NGO / multilateral</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intent">Request type</Label>
          <Select id="intent" name="intent" defaultValue={intentDefault}>
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
