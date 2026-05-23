"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  { intent: "briefing", label: "Generate exec briefing" },
  { intent: "summarize_alerts", label: "Summarize open alerts" },
  { intent: "stakeholder_update", label: "Draft stakeholder update" },
  { intent: "resource_request", label: "Draft resource request" },
  { intent: "ministry_outreach", label: "Draft ministry outreach" },
  { intent: "explain_risk", label: "Explain risk scoring" },
];

interface Msg {
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  provider?: string;
  intent?: string;
}

export function AICommandClient() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Hi — I'm the OutbreakOS command assistant. I can generate briefings, summarize alerts, draft stakeholder updates, suggest reorder lists, and explain risk-tier decisions. Ask anything operational, or use a shortcut.",
      provider: "system",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(question: string, intent?: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: question, intent }),
    });
    const j = await r.json();
    setBusy(false);
    setMessages((m) => [
      ...m,
      { role: "assistant", text: j.text, citations: j.citations, provider: j.provider, intent },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <button
            key={s.intent}
            onClick={() =>
              ask(
                s.label === "Explain risk scoring"
                  ? "Explain how operational risk scores are computed and what each tier means."
                  : s.label,
                s.intent,
              )
            }
            disabled={busy}
            className="rounded-full border border-border bg-card/40 hover:bg-card/60 px-3 py-1.5 text-xs font-medium"
          >
            <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border bg-card/40 max-h-[500px] overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 animate-fade-in",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-4 py-3 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  <p className="text-xs text-muted-foreground mb-1">Internal data cited:</p>
                  <div className="flex flex-wrap gap-1">
                    {m.citations.slice(0, 8).map((c) => (
                      <Badge key={c} variant="outline" className="text-xs font-mono">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {m.role === "assistant" && m.provider && m.provider !== "system" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Provider: <code>{m.provider}</code> · Human review required.
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span>Thinking…</span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask: What are my top three risks in the next 24 hours?"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  );
}
