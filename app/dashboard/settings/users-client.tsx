"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { UserPlus, X, Copy } from "lucide-react";
import type { Profile, Role } from "@/lib/types";

interface UserRow extends Profile {
  deactivated?: boolean;
}

const ROLES: Role[] = ["admin", "health_officer", "screener", "viewer"];

export function UsersClient({
  users: initial,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initial);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function invite(email: string, name: string, role: Role) {
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    const j = await r.json();
    if (!r.ok) {
      toast(j.error || "Could not invite user.", "error");
      return;
    }
    setUsers((u) => [{ ...j.user, deactivated: false } as UserRow, ...u]);
    setShowInvite(false);
    if (j.inviteLink) {
      setInviteLink(j.inviteLink);
      toast("User invited. Copy the set-password link below to share.", "success");
    } else {
      toast("User invited — set-password email sent.", "success");
    }
    router.refresh();
  }

  async function patch(userId: string, body: Record<string, unknown>) {
    const r = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    const j = await r.json();
    if (!r.ok) {
      toast(j.error || "Update failed.", "error");
      return;
    }
    if (body.role) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role: body.role as Role } : x)));
      toast("Role updated. The user's existing sessions were revoked.", "success");
    }
    if (body.active !== undefined) {
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, deactivated: !body.active } : x)));
      toast(body.active ? "User reactivated." : "User deactivated and sessions revoked.", "success");
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
          <UserPlus className="h-4 w-4" /> Invite user
        </Button>
      </div>

      {showInvite && <InviteForm onInvite={invite} onCancel={() => setShowInvite(false)} />}

      {inviteLink && (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          <p className="text-xs text-muted-foreground mb-1">
            No email provider configured — share this one-time set-password link with the invitee:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs bg-background/60 rounded px-2 py-1">{inviteLink}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(inviteLink);
                toast("Copied.", "success");
              }}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-border rounded-md border border-border">
        {users.map((u) => (
          <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">
                {u.name}
                {u.id === currentUserId && <Badge variant="muted">you</Badge>}
                {u.deactivated && <Badge variant="critical">deactivated</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {u.id === currentUserId || u.role === "owner" ? (
                <Badge variant="muted" className="capitalize">{u.role.replace("_", " ")}</Badge>
              ) : (
                <>
                  <Select
                    value={u.role}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className="h-8 w-40 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant={u.deactivated ? "outline" : "destructive"}
                    onClick={() => patch(u.id, { active: !!u.deactivated })}
                  >
                    {u.deactivated ? "Reactivate" : "Deactivate"}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InviteForm({
  onInvite,
  onCancel,
}: {
  onInvite: (email: string, name: string, role: Role) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("screener");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onInvite(email, name, role);
      }}
      className="rounded-md border border-border bg-card/40 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Invite a team member</h4>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="admin">Admin</option>
            <option value="health_officer">Health Officer</option>
            <option value="screener">Screener</option>
            <option value="viewer">Viewer</option>
          </Select>
        </div>
      </div>
      <Button type="submit" size="sm">Send invite</Button>
    </form>
  );
}
