// Centralized role-based access control. Every mutating server action /
// API route MUST call requireRole() rather than rely on UI hiding.

import type { Role } from "./types.ts";

export type Capability =
  | "screening.create"
  | "screening.read"
  | "contact.create"
  | "contact.update"
  | "contact.read"
  | "alert.create"
  | "alert.update"
  | "alert.read"
  | "resource.update"
  | "resource.read"
  | "report.create"
  | "report.read"
  | "site.create"
  | "site.update"
  | "user.invite"
  | "settings.update"
  | "settings.read"
  | "audit.read"
  | "audit.export"
  | "org.export"
  | "ai.invoke"
  | "lead.read";

const matrix: Record<Role, Capability[]> = {
  viewer: [
    "screening.read",
    "contact.read",
    "alert.read",
    "resource.read",
    "report.read",
    "audit.read",
    "settings.read",
  ],
  screener: [
    "screening.create",
    "screening.read",
    "contact.read",
    "alert.read",
    "resource.read",
    "report.read",
    "settings.read",
    "ai.invoke",
  ],
  health_officer: [
    "screening.create",
    "screening.read",
    "contact.create",
    "contact.update",
    "contact.read",
    "alert.create",
    "alert.update",
    "alert.read",
    "resource.read",
    "report.create",
    "report.read",
    "audit.read",
    "settings.read",
    "ai.invoke",
  ],
  admin: [
    "screening.create",
    "screening.read",
    "contact.create",
    "contact.update",
    "contact.read",
    "alert.create",
    "alert.update",
    "alert.read",
    "resource.update",
    "resource.read",
    "report.create",
    "report.read",
    "site.create",
    "site.update",
    "user.invite",
    "settings.update",
    "settings.read",
    "audit.read",
    "audit.export",
    "ai.invoke",
  ],
  owner: [
    "screening.create",
    "screening.read",
    "contact.create",
    "contact.update",
    "contact.read",
    "alert.create",
    "alert.update",
    "alert.read",
    "resource.update",
    "resource.read",
    "report.create",
    "report.read",
    "site.create",
    "site.update",
    "user.invite",
    "settings.update",
    "settings.read",
    "audit.read",
    "audit.export",
    "org.export",
    "ai.invoke",
    "lead.read",
  ],
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  return matrix[role].includes(cap);
}

export class PermissionError extends Error {
  capability: Capability;
  constructor(capability: Capability) {
    super(`Missing capability: ${capability}`);
    this.capability = capability;
    this.name = "PermissionError";
  }
}
