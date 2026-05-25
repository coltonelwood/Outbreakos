import { test } from "node:test";
import assert from "node:assert/strict";
import { resetDb, createOrg, addContact, data } from "../lib/store.ts";
import { runScheduledJobs } from "../lib/scheduler.ts";

// One sequential test: the in-memory store is a process-global singleton, so
// splitting into multiple top-level tests lets them interleave on shared state.
test("scheduler: missed-checkin detection, idempotency, and cleared-contact skip", async () => {
  resetDb();

  // Org A: an active contact enrolled 3 days ago with only day-1 logged ->
  // day 4 is due and missing.
  const orgA = await createOrg("SchedA", "mining_site");
  const start = new Date(Date.now() - 3 * 86400000).toISOString();
  await addContact(orgA.id, "system", {
    name: "C-active",
    monitoringStart: start,
    monitoringEnd: new Date(Date.now() + 18 * 86400000).toISOString(),
    status: "active",
    checkins: [{ day: 1, date: start, status: "ok" }],
    notes: "",
  });

  // Org B: a cleared contact — must never be flagged.
  const orgB = await createOrg("SchedB", "mining_site");
  await addContact(orgB.id, "system", {
    name: "C-cleared",
    monitoringStart: new Date(Date.now() - 5 * 86400000).toISOString(),
    monitoringEnd: new Date(Date.now() + 16 * 86400000).toISOString(),
    status: "cleared",
    checkins: [],
    notes: "",
  });

  await runScheduledJobs();

  const aMissed = (await data.alerts(orgA.id)).filter((x) => x.category === "missed_checkin");
  assert.equal(aMissed.length, 1, "org A active-behind contact -> exactly one missed alert");

  const bMissed = (await data.alerts(orgB.id)).filter((x) => x.category === "missed_checkin");
  assert.equal(bMissed.length, 0, "org B cleared contact -> no missed alert");

  // Idempotent: a second run creates no duplicate alert.
  await runScheduledJobs();
  const aMissed2 = (await data.alerts(orgA.id)).filter((x) => x.category === "missed_checkin");
  assert.equal(aMissed2.length, 1, "re-run does not duplicate the missed alert");
});
