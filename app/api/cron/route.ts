import { NextResponse } from "next/server";
import { runScheduledJobs } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Triggered by Vercel Cron (see vercel.json) or any scheduler. Authorized via
// CRON_SECRET: Vercel Cron sends "Authorization: Bearer $CRON_SECRET"
// automatically when the env var is set. Manual callers can pass ?key= too.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // dev: allow; prod: require
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const key = new URL(req.url).searchParams.get("key");
  return key === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  try {
    const summary = await runScheduledJobs();
    return NextResponse.json({ ok: true, durationMs: Date.now() - started, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
