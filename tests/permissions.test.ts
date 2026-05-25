import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../lib/permissions.ts";

test("viewer cannot mutate", () => {
  assert.equal(can("viewer", "screening.create"), false);
  assert.equal(can("viewer", "alert.update"), false);
  assert.equal(can("viewer", "resource.update"), false);
  assert.equal(can("viewer", "site.create"), false);
  assert.equal(can("viewer", "settings.update"), false);
});

test("viewer can read", () => {
  assert.equal(can("viewer", "screening.read"), true);
  assert.equal(can("viewer", "contact.read"), true);
  assert.equal(can("viewer", "alert.read"), true);
});

test("screener can create screenings but not update alerts or resources", () => {
  assert.equal(can("screener", "screening.create"), true);
  assert.equal(can("screener", "alert.update"), false);
  assert.equal(can("screener", "resource.update"), false);
});

test("health officer manages contacts/alerts but not site/settings/user invitations", () => {
  assert.equal(can("health_officer", "contact.update"), true);
  assert.equal(can("health_officer", "alert.update"), true);
  assert.equal(can("health_officer", "report.create"), true);
  assert.equal(can("health_officer", "site.create"), false);
  assert.equal(can("health_officer", "settings.update"), false);
  assert.equal(can("health_officer", "user.invite"), false);
});

test("admin manages resources, sites, settings, users but cannot export org", () => {
  assert.equal(can("admin", "resource.update"), true);
  assert.equal(can("admin", "site.create"), true);
  assert.equal(can("admin", "settings.update"), true);
  assert.equal(can("admin", "user.invite"), true);
  assert.equal(can("admin", "org.export"), false);
});

test("owner has every capability", () => {
  assert.equal(can("owner", "screening.create"), true);
  assert.equal(can("owner", "settings.update"), true);
  assert.equal(can("owner", "org.export"), true);
  assert.equal(can("owner", "audit.export"), true);
  assert.equal(can("owner", "ai.invoke"), true);
});

test("undefined role has no capabilities", () => {
  assert.equal(can(undefined, "screening.read"), false);
});
