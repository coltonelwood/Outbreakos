import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseAdmin();
  const out: Record<string, unknown> = {};
  out.serviceKeyLen = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").length;
  out.url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sel = await sb.from("sites").select("*").limit(3);
  out.selectError = sel.error?.message ?? null;
  out.selectCount = sel.data?.length ?? null;
  out.selectFirstKeys = sel.data?.[0] ? Object.keys(sel.data[0]) : null;
  const orgs = await sb.from("organizations").select("id,name").limit(3);
  out.orgsError = orgs.error?.message ?? null;
  out.orgsCount = orgs.data?.length ?? null;
  return NextResponse.json(out);
}
