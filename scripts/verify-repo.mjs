// Exercises the Supabase repository end-to-end against the LIVE database via
// tsx (so it runs the real TypeScript repo). Creates an org, user, screening
// (which must auto-create an alert + contact), reads everything back, checks
// the audit log, then cleans up. Proves the repo's writes/reads/mappers work.
import { repo } from "../lib/repo.ts";
import { supabaseAdmin } from "../lib/supabase/server.ts";

const log = (m) => console.log(m);
const fail = (m) => { console.error("❌ " + m); process.exit(1); };

const created = { orgId: null };
try {
  const org = await repo.createOrg("repo-test-" + Date.now(), "mining_site");
  created.orgId = org.id;
  log(`✓ createOrg -> ${org.id}`);

  const user = await repo.createUser(org.id, { email: `u_${Date.now()}@t.io`, name: "T", role: "owner" }, "password1234");
  log(`✓ createUser -> ${user.id}`);
  if (!(await repo.verifyPassword(user.id, "password1234"))) fail("verifyPassword(correct) returned false");
  if (await repo.verifyPassword(user.id, "wrong")) fail("verifyPassword(wrong) returned true");
  log("✓ verifyPassword correct=true wrong=false");

  const site = await repo.createSite(org.id, user.id, { name: "Mine A", kind: "mine", country: "DRC", region: "Ituri", lat: 1.85, lng: 30.18, workersPerDay: 900, status: "active" });
  log(`✓ createSite -> ${site.id}`);

  const scr = await repo.addScreening(org.id, user.id, {
    siteId: site.id, context: "site_entry", subjectName: "X", anonymous: true, ageRange: "40-59",
    originCountry: "DRC", originRegion: "Bundibugyo", destination: "Mine", travelHistory: ["Bundibugyo"],
    contactWithCase: true, symptoms: { fever: true, vomitingDiarrhea: false, unexplainedBleeding: true, fatigue: false, headache: false },
    hcwExposure: false, funeralExposure: true, notes: "", risk: "urgent",
    action: "Isolate and notify health officer", rationale: ["fever", "bleeding", "contact", "funeral"], createdBy: user.id,
  });
  log(`✓ addScreening -> ${scr.id} (risk=${scr.risk})`);

  const screenings = await repo.screenings(org.id);
  if (screenings.length !== 1) fail(`expected 1 screening, got ${screenings.length}`);
  log(`✓ screenings read back: ${screenings.length}`);

  const alerts = await repo.alerts(org.id);
  if (alerts.length !== 1) fail(`urgent screening should auto-create 1 alert, got ${alerts.length}`);
  log(`✓ auto-created alert: "${alerts[0].title}" (${alerts[0].severity})`);

  const contacts = await repo.contacts(org.id);
  if (contacts.length !== 1) fail(`urgent screening should auto-enroll 1 contact, got ${contacts.length}`);
  log(`✓ auto-enrolled contact: ${contacts[0].status}`);

  const audit = await repo.audit(org.id);
  if (audit.length < 3) fail(`expected >=3 audit events, got ${audit.length}`);
  log(`✓ audit log persisted: ${audit.length} events (${audit.map((a) => a.action).slice(0, 4).join(", ")}…)`);

  await repo.addNotification(org.id, { channel: "slack", target: "ops", subject: "test", body: "b", severity: "critical", status: "sent" });
  const { data: notifs } = await supabaseAdmin().from("notifications").select("*").eq("org_id", org.id);
  if (!notifs || notifs.length !== 1) fail("notification did not persist");
  log(`✓ notification persisted (status=${notifs[0].status})`);

  const lead = await repo.addLead({ email: "lead@t.io", intent: "pilot", source: "repo-test", utm: { utm_source: "test" } });
  log(`✓ addLead -> ${lead.id}`);
  await supabaseAdmin().from("leads").delete().eq("id", lead.id);

  log("\n✅ Repository verified end-to-end against live Supabase.");
} catch (e) {
  fail(e?.message || String(e));
} finally {
  if (created.orgId) {
    // cascade deletes screenings/contacts/alerts/audit/sites/settings/profiles
    await supabaseAdmin().from("organizations").delete().eq("id", created.orgId);
    // user_credentials cascade via profiles; clean any orphans best-effort
    log(`(cleaned up org ${created.orgId})`);
  }
}
