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

test("bcrypt: correct password verifies, wrong rejected", () => {
  resetDb();
  const org = createOrg("Acme", "mining_site");
  const u = createUser(org.id, { email: "a@b.com", name: "A", role: "admin" }, "supersecret");
  assert.equal(verifyPassword(u.id, "supersecret"), true);
  assert.equal(verifyPassword(u.id, "wrong"), false);
});

test("session revocation bumps version", () => {
  resetDb();
  const org = createOrg("Acme", "mining_site");
  const u = createUser(org.id, { email: "a@b.com", name: "A", role: "admin" }, "pw12345678");
  const v0 = currentSessionVersion(u.id);
  revokeUserSessions(u.id, u.id, org.id);
  assert.equal(currentSessionVersion(u.id), v0 + 1);
});

test("deactivation blocks auth and bumps version", () => {
  resetDb();
  const org = createOrg("Acme", "mining_site");
  const u = createUser(org.id, { email: "a@b.com", name: "A", role: "screener" }, "pw12345678");
  const v0 = currentSessionVersion(u.id);
  setUserActive(org.id, u.id, false, "owner");
  assert.equal(isDeactivated(u.id), true);
  assert.equal(verifyPassword(u.id, "pw12345678"), false); // deactivated can't auth
  assert.ok(currentSessionVersion(u.id) > v0); // sessions revoked
  setUserActive(org.id, u.id, true, "owner");
  assert.equal(isDeactivated(u.id), false);
  assert.equal(verifyPassword(u.id, "pw12345678"), true);
});

test("role change revokes sessions", () => {
  resetDb();
  const org = createOrg("Acme", "mining_site");
  const u = createUser(org.id, { email: "a@b.com", name: "A", role: "viewer" }, "pw12345678");
  const v0 = currentSessionVersion(u.id);
  const updated = changeUserRole(org.id, u.id, "health_officer", "owner");
  assert.equal(updated?.role, "health_officer");
  assert.ok(currentSessionVersion(u.id) > v0);
});

test("invite -> set-password token flow", () => {
  resetDb();
  const org = createOrg("Acme", "mining_site");
  const { user, token } = inviteUser(org.id, "owner", "new@b.com", "New Person", "screener");
  // invited user can't log in until they set a password (temp pw unknown)
  assert.equal(verifyPassword(user.id, "anything"), false);
  const completed = consumeSetPasswordToken(token, "myNewPassword1");
  assert.equal(completed?.id, user.id);
  assert.equal(verifyPassword(user.id, "myNewPassword1"), true);
  // token is one-time
  assert.equal(consumeSetPasswordToken(token, "x"), null);
});

test("cross-org isolation: changeUserRole won't touch another org's user", () => {
  resetDb();
  const orgA = createOrg("A", "mining_site");
  const orgB = createOrg("B", "mining_site");
  const uB = createUser(orgB.id, { email: "b@b.com", name: "B", role: "viewer" }, "pw12345678");
  // Org A admin tries to change Org B's user — must fail (returns null).
  const res = changeUserRole(orgA.id, uB.id, "admin", "attackerA");
  assert.equal(res, null);
  // Org B user unchanged.
  assert.equal(uB.role, "viewer");
});
