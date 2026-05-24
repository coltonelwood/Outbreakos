// Operational notification dispatch.
//
// Real channels:
//   - Slack    (ALERTS_WEBHOOK_URL or LEADS_WEBHOOK_URL)
//   - Email    (RESEND_API_KEY) — adapter; logs + records if unconfigured
//   - SMS      (Twilio: TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM) — adapter
//
// Every dispatch is recorded with status (sent / failed / skipped) and is
// audited, so an operator can SEE whether the on-call health officer was
// actually told. Delivery records persist in the store (Postgres:
// `notifications` table).

import { addNotification, logAudit } from "./store";
import { uid } from "./utils";
import type { Severity } from "./types";

export interface NotificationRecord {
  id: string;
  orgId: string;
  channel: "slack" | "email" | "sms";
  target: string;
  subject: string;
  body: string;
  severity: Severity;
  status: "sent" | "failed" | "skipped";
  error?: string;
  createdAt: string;
}

function records(): NotificationRecord[] {
  const g = globalThis as unknown as { __outbreakos_notifications?: NotificationRecord[] };
  if (!g.__outbreakos_notifications) g.__outbreakos_notifications = [];
  return g.__outbreakos_notifications;
}

export function listNotifications(orgId: string): NotificationRecord[] {
  return records().filter((n) => n.orgId === orgId);
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

async function sendSlack(subject: string, body: string): Promise<void> {
  const url = process.env.ALERTS_WEBHOOK_URL || process.env.LEADS_WEBHOOK_URL;
  if (!url) throw new Error("no-slack-webhook");
  await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${subject}*\n${body}` }),
    }),
    5000,
  );
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("no-email-provider");
  await withTimeout(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "alerts@outbreakos.io",
        to,
        subject,
        text: body,
      }),
    }),
    5000,
  );
}

async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) throw new Error("no-sms-provider");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  await withTimeout(
    fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
      body: params.toString(),
    }),
    5000,
  );
}

interface DispatchInput {
  orgId: string;
  channel: NotificationRecord["channel"];
  target: string;
  subject: string;
  body: string;
  severity: Severity;
}

export async function dispatch(input: DispatchInput): Promise<NotificationRecord> {
  const rec: NotificationRecord = {
    id: uid("ntf"),
    orgId: input.orgId,
    channel: input.channel,
    target: input.target,
    subject: input.subject,
    body: input.body,
    severity: input.severity,
    status: "skipped",
    createdAt: new Date().toISOString(),
  };
  try {
    if (input.channel === "slack") await sendSlack(input.subject, input.body);
    else if (input.channel === "email") await sendEmail(input.target, input.subject, input.body);
    else await sendSms(input.target, input.body);
    rec.status = "sent";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // "no-*-provider" means the channel isn't configured — that's "skipped",
    // not "failed". A genuine network error is "failed".
    rec.status = msg.startsWith("no-") ? "skipped" : "failed";
    rec.error = msg;
  }
  records().unshift(rec);
  // Persist the delivery record (Supabase notifications table) + audit it.
  await addNotification(input.orgId, {
    channel: rec.channel,
    target: rec.target,
    subject: rec.subject,
    body: rec.body,
    severity: rec.severity,
    status: rec.status,
    error: rec.error,
  });
  await logAudit(input.orgId, "system", `notify.${rec.status}`, rec.id, {
    channel: rec.channel,
    severity: rec.severity,
  });
  return rec;
}

// Fan-out for an operational event. Tries Slack always; email/SMS when a
// target + provider exist. Fire-and-forget friendly.
export async function notifyEvent(opts: {
  orgId: string;
  severity: Severity;
  subject: string;
  body: string;
  email?: string;
  phone?: string;
}): Promise<NotificationRecord[]> {
  const out: NotificationRecord[] = [];
  out.push(await dispatch({ ...opts, channel: "slack", target: "ops-channel" }));
  if (opts.email) out.push(await dispatch({ ...opts, channel: "email", target: opts.email }));
  if (opts.phone) out.push(await dispatch({ ...opts, channel: "sms", target: opts.phone }));
  return out;
}
