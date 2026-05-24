import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resetDb,
  createOrg,
  createUser,
  verifyPassword,
  currentSessionVersion,
  revokeUserSessions,
  setUserActive,
  changeUserRole,
  inviteUser,
  consumeSetPasswordToken,
  isDeactivated,
} from "../lib/store.ts";

// These tests exercise the in-memory backend (no Supabase env in CI). The
// Supabase backend is verified separately by scripts/verify-repo.mjs against
// the live database. All store functions are async.

test("bcrypt: correct password verifies, wrong rejected", async () => {
  resetDb();
  const org = await createOrg("Acme", "mining_site");
  const u = await createUser(org.id, { email: "a@b.com", name: "A", role: "admin" }, "supersecret");
  assert.equal(await verifyPassword(u.id, "supersecret"), true);
  assert.equal(await verifyPassword(u.id, "wrong"), false);
});

test("session revocation bumps version", async () => {
  resetDb();
  const org = await createOrg("Acme", "mining_site");
  const u = await createUser(org.id, { email: "a@b.com", name: "A", role: "admin" }, "pw12345678");
  const v0 = await currentSessionVersion(u.id);
  await revokeUserSessions(u.id, u.id, org.id);
  assert.equal(await currentSessionVersion(u.id), v0 + 1);
});

test("deactivation blocks auth and bumps version", async () => {
  resetDb();
  const org = await createOrg("Acme", "mining_site");
  const u = await createUser(org.id, { email: "a@b.com", name: "A", role: "screener" }, "pw12345678");
  const v0 = await currentSessionVersion(u.id);
  await setUserActive(org.id, u.id, false, "owner");
  assert.equal(await isDeactivated(u.id), true);
  assert.equal(await verifyPassword(u.id, "pw12345678"), false);
  assert.ok((await currentSessionVersion(u.id)) > v0);
  await setUserActive(org.id, u.id, true, "owner");
  assert.equal(await isDeactivated(u.id), false);
  assert.equal(await verifyPassword(u.id, "pw12345678"), true);
});

test("role change revokes sessions", async () => {
  resetDb();
  const org = await createOrg("Acme", "mining_site");
  const u = await createUser(org.id, { email: "a@b.com", name: "A", role: "viewer" }, "pw12345678");
  const v0 = await currentSessionVersion(u.id);
  const updated = await changeUserRole(org.id, u.id, "health_officer", "owner");
  assert.equal(updated?.role, "health_officer");
  assert.ok((await currentSessionVersion(u.id)) > v0);
});

test("invite -> set-password token flow", async () => {
  resetDb();
  const org = await createOrg("Acme", "mining_site");
  const { user, token } = await inviteUser(org.id, "owner", "new@b.com", "New Person", "screener");
  assert.equal(await verifyPassword(user.id, "anything"), false);
  const completed = await consumeSetPasswordToken(token, "myNewPassword1");
  assert.equal(completed?.id, user.id);
  assert.equal(await verifyPassword(user.id, "myNewPassword1"), true);
  assert.equal(await consumeSetPasswordToken(token, "x"), null);
});

test("cross-org isolation: changeUserRole won't touch another org's user", async () => {
  resetDb();
  const orgA = await createOrg("A", "mining_site");
  const orgB = await createOrg("B", "mining_site");
  const uB = await createUser(orgB.id, { email: "b@b.com", name: "B", role: "viewer" }, "pw12345678");
  const res = await changeUserRole(orgA.id, uB.id, "admin", "attackerA");
  assert.equal(res, null);
  assert.equal(uB.role, "viewer");
});
