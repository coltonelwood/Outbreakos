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
              {m.role === "assistant" ? (
                <MarkdownView text={m.text} citations={m.citations} />
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
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

// Minimal markdown renderer tuned for the AI assistant's structured output.
// Supports: blank-line paragraphs, leading "•" / "-" / "*" / "1." bullets,
// **bold**, `code`, and inline citation chips for tokens that look like
// internal IDs (region:..., site:..., screening:..., alert:..., resource:...,
// settings:..., scr_..., al_..., r_..., site_..., reg_..., rpt_..., ct_...).
function MarkdownView({ text, citations }: { text: string; citations?: string[] }) {
  const citationSet = new Set(citations || []);
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isBulletList = lines.every((l) => /^\s*([•\-*]|\d+\.)\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={i} className="space-y-1 pl-1">
              {lines.map((l, j) => {
                const stripped = l.replace(/^\s*([•\-*]|\d+\.)\s+/, "");
                return (
                  <li key={j} className="flex gap-2">
                    <span className="text-primary mt-1 text-[10px]">●</span>
                    <span className="flex-1">{renderInline(stripped, citationSet)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        // Treat single-line all-caps short blocks as headings.
        if (lines.length === 1 && lines[0].length < 80 && /^[A-Z][A-Za-z ()/]+$/.test(lines[0])) {
          return (
            <h4 key={i} className="text-xs font-semibold uppercase tracking-wider text-primary mt-2">
              {lines[0]}
            </h4>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {lines.map((l, j) => (
              <span key={j}>
                {renderInline(l, citationSet)}
                {j < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const ID_RE = /\b(?:[a-z]+:)?(?:scr|al|r|site|reg|rpt|ct|u|org|lead|a)_[a-z0-9]{4,}\b/gi;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const CODE_RE = /`([^`]+)`/g;

function renderInline(s: string, citationSet: Set<string>): React.ReactNode {
  // Cheap-and-correct: tokenize on bold + code + IDs.
  const out: React.ReactNode[] = [];
  let rest = s;
  let key = 0;
  while (rest.length) {
    const m = rest.match(BOLD_RE) || rest.match(CODE_RE) || rest.match(ID_RE);
    if (!m) {
      out.push(<span key={key++}>{rest}</span>);
      break;
    }
    const idx = rest.indexOf(m[0]);
    if (idx > 0) out.push(<span key={key++}>{rest.slice(0, idx)}</span>);
    const token = m[0];
    if (token.startsWith("**")) {
      out.push(
        <strong key={key++}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith("`")) {
      out.push(
        <code key={key++} className="text-xs bg-background/40 px-1 rounded">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const cited = citationSet.has(token);
      out.push(
        <span
          key={key++}
          className={
            "inline-block rounded-md px-1.5 py-0 mx-0.5 text-[11px] font-mono border align-baseline " +
            (cited
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-muted text-muted-foreground border-border")
          }
        >
          {token}
        </span>,
      );
    }
    rest = rest.slice(idx + token.length);
  }
  return out;
}
