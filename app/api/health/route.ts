import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/server";

// Lightweight liveness + readiness probe.
// - Always returns 200 if the process is running.
// - Reports backend configuration so uptime monitors / dashboards can alert.
export function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    backends: {
      store: isSupabaseConfigured() ? "supabase-ready" : "in-memory",
      ratelimit:
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
          ? "upstash"
          : "in-process",
      aiProvider: process.env.AI_PROVIDER || "none",
      messaging: process.env.MESSAGING_PROVIDER || "none",
      leadsWebhook: process.env.LEADS_WEBHOOK_URL ? "configured" : "not-configured",
    },
    counts: {
      orgs: db().orgs.length,
      users: db().users.length,
      leads: db().leads.length,
    },
  });
}
