// Recurring operational jobs, designed to be triggered by a cron call
// (Vercel Cron -> GET /api/cron). Idempotent and audited:
//   1. Missed check-in detection — contacts in their 21-day window whose latest
//      check-in is behind the expected day get marked "missed" for the due day
//      and raise a missed_checkin alert + notification (once per due day).
//   2. Stale alert escalation — open critical/high alerts older than a threshold
//      with no owner get re-notified (once per escalation window).
//
// Runs across all orgs (admin scope) using org-scoped store mutations.

import { data, listOrgIds, logCheckin, addAlert, setAlertStatus } from "./store";
import { notifyEvent } from "./notify";

const STALE_ALERT_HOURS = 6;

export interface JobSummary {
  orgs: number;
  missedCheckins: number;
  missedCheckinAlerts: number;
  staleAlertsEscalated: number;
}

function daysBetween(fromIso: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(fromIso).getTime()) / 86400000);
}

export async function runScheduledJobs(now = new Date()): Promise<JobSummary> {
  const summary: JobSummary = { orgs: 0, missedCheckins: 0, missedCheckinAlerts: 0, staleAlertsEscalated: 0 };
  const orgIds = await listOrgIds();
  summary.orgs = orgIds.length;
  // Collect notification dispatches and flush them before returning, so a cron
  // run completes its delivery records (and nothing leaks past the function).
  const notifications: Promise<unknown>[] = [];

  for (const orgId of orgIds) {
    // ---- 1. Missed check-in detection -----------------------------------
    const [contacts, alerts] = await Promise.all([data.contacts(orgId), data.alerts(orgId)]);
    for (const c of contacts) {
      if (c.status !== "active") continue;
      const expectedDay = Math.min(21, daysBetween(c.monitoringStart, now) + 1);
      if (expectedDay < 1) continue;
      if (now.getTime() > new Date(c.monitoringEnd).getTime()) continue; // window closed
      const logged = c.checkins.find((x) => x.day === expectedDay);
      if (logged) continue; // already has today's check-in (ok/symptom/missed)

      // Mark the due day missed (idempotent: logCheckin upserts by day).
      await logCheckin(orgId, c.id, expectedDay, "missed", "scheduler");
      summary.missedCheckins += 1;

      // Raise a missed_checkin alert once per contact+day (dedupe by linkedId).
      const linkedId = `${c.id}:day${expectedDay}`;
      const exists = alerts.some(
        (a) => a.category === "missed_checkin" && a.linkedId === linkedId,
      );
      if (!exists) {
        await addAlert(orgId, "scheduler", {
          category: "missed_checkin",
          severity: "warning",
          title: `Missed day-${expectedDay} check-in — ${c.name}`,
          description: `${c.name} has not completed their day-${expectedDay} check-in within the 21-day monitoring window. Follow up.`,
          linkedId,
        });
        summary.missedCheckinAlerts += 1;
        notifications.push(notifyEvent({
          orgId,
          severity: "warning",
          subject: `Missed check-in — ${c.name}`,
          body: `Day-${expectedDay} check-in missing for ${c.name}. Operational follow-up required (not a clinical determination).`,
        }));
      }
    }

    // ---- 2. Stale alert escalation --------------------------------------
    for (const a of alerts) {
      if (a.status !== "open") continue;
      if (a.severity !== "critical" && a.severity !== "high") continue;
      if (a.owner) continue; // already owned
      const ageHours = (now.getTime() - new Date(a.createdAt).getTime()) / 3600000;
      if (ageHours < STALE_ALERT_HOURS) continue;
      // Mark acknowledged-by-system to avoid re-escalating every run, and notify.
      await setAlertStatus(orgId, a.id, "ack", "scheduler");
      summary.staleAlertsEscalated += 1;
      notifications.push(notifyEvent({
        orgId,
        severity: a.severity,
        subject: `Unacknowledged ${a.severity} alert — ${a.title}`,
        body: `Alert open ${Math.round(ageHours)}h with no owner. Escalating for review. Human review required.`,
      }));
    }
  }

  await Promise.allSettled(notifications);
  return summary;
}
