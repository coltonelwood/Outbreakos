"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ContactStatusPill } from "@/components/ui/status-pill";
import { formatDate, cn } from "@/lib/utils";
import { UserPlus, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Contact } from "@/lib/types";

const TEMPLATES = {
  daily: "OutbreakOS daily check-in: please reply 1=I am well, 2=I have new symptoms. If 2, we will contact you within the hour.",
  missed: "OutbreakOS: we missed your daily check-in. Please reply with your status (1=well, 2=new symptoms). A team member is available if you need help.",
  escalation:
    "OutbreakOS: based on your check-in we are routing a clinical team to follow up with you. Please remain reachable on this number.",
  cleared:
    "OutbreakOS: you have completed your 21-day monitoring window with no symptoms. Thank you for participating. Stay well.",
};

export function ContactsClient({ contacts: initial }: { contacts: Contact[] }) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [templateOpen, setTemplateOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Contact | null>(initial[0] ?? null);

  async function addContact(data: { name: string; phone: string; notes: string }) {
    const r = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (r.ok && j.contact) {
      setContacts((c) => [j.contact, ...c]);
      setShowAdd(false);
      router.refresh();
    }
  }

  async function updateStatus(id: string, status: Contact["status"]) {
    const r = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setContacts((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status } : s));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowAdd(!showAdd)}>
          <UserPlus className="h-4 w-4" /> Add contact
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>Add a contact</CardTitle></CardHeader>
          <CardContent>
            <AddContactForm onAdd={addContact} onCancel={() => setShowAdd(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Contacts ({contacts.length})</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto scrollbar-thin">
            <ul className="divide-y divide-border">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/30 transition-colors",
                    selected?.id === c.id && "bg-muted/40 border-l-2 border-primary",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{c.name}</div>
                    <ContactStatusPill status={c.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.phone || "no phone"} · enrolled {formatDate(c.monitoringStart)}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selected ? selected.name : "Select a contact"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected && (
              <p className="text-sm text-muted-foreground">Pick a contact from the list to see their 21-day timeline.</p>
            )}
            {selected && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Phone" value={selected.phone || "—"} />
                  <Info label="Status" value={selected.status.replace(/_/g, " ")} />
                  <Info label="Monitoring start" value={formatDate(selected.monitoringStart)} />
                  <Info label="Monitoring end" value={formatDate(selected.monitoringEnd)} />
                </div>
                <p className="text-sm text-muted-foreground">{selected.notes}</p>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    21-day timeline
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 21 }, (_, i) => i + 1).map((day) => {
                      const ci = selected.checkins.find((c) => c.day === day);
                      const stateClass = !ci
                        ? "bg-muted/40 text-muted-foreground"
                        : ci.status === "ok"
                          ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                          : ci.status === "symptom"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]";
                      return (
                        <div
                          key={day}
                          title={ci ? `Day ${day}: ${ci.status}` : `Day ${day}: not yet`}
                          className={cn(
                            "aspect-square rounded-md flex items-center justify-center text-[10px] font-medium",
                            stateClass,
                          )}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" /> OK</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Symptom</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" /> Missed</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted/60" /> Pending</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(selected.id, "escalated")}>
                    <AlertTriangle className="h-4 w-4" /> Escalate
                  </Button>
                  <Button size="sm" variant="success" onClick={() => updateStatus(selected.id, "cleared")}>
                    <CheckCircle2 className="h-4 w-4" /> Mark cleared
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setTemplateOpen(templateOpen ? null : "daily")}>
                    <MessageSquare className="h-4 w-4" /> Message templates
                  </Button>
                </div>

                {templateOpen && (
                  <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(["daily", "missed", "escalation", "cleared"] as const).map((k) => (
                        <button
                          key={k}
                          onClick={() => setTemplateOpen(k)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium",
                            templateOpen === k ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm">{TEMPLATES[templateOpen as keyof typeof TEMPLATES]}</p>
                    <p className="text-xs text-muted-foreground">
                      SMS / WhatsApp routing through the configured messaging
                      provider. In demo mode messages are not actually sent.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1 capitalize">{value}</div>
    </div>
  );
}

function AddContactForm({
  onAdd,
  onCancel,
}: {
  onAdd: (d: { name: string; phone: string; notes: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({ name, phone, notes });
      }}
      className="space-y-3"
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contact name / ID</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Phone (for SMS / WhatsApp)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243…" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add contact</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
