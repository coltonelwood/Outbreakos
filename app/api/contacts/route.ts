import { NextResponse } from "next/server";
import { z } from "zod";
import { addContact, db } from "@/lib/store";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const c = addContact({
    name: parsed.data.name,
    phone: parsed.data.phone,
    monitoringStart: new Date().toISOString(),
    monitoringEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
    status: "active",
    checkins: [{ day: 1, date: new Date().toISOString(), status: "ok" }],
    notes: parsed.data.notes || "",
  });
  return NextResponse.json({ contact: c });
}

export async function GET() {
  return NextResponse.json({ contacts: db().contacts });
}
