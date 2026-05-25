"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  variant: Variant;
}

interface Ctx {
  toast: (message: string, variant?: Variant) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) return { toast: () => {} };
  return c;
}

let counter = 0;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, variant: Variant = "info") => {
    const id = ++counter;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm"
        role="region"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({
  message,
  variant,
  onClose,
}: Toast & { onClose: () => void }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 10);
    return () => clearTimeout(t);
  }, []);
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : Info;
  const color =
    variant === "success"
      ? "text-[hsl(var(--success))] border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10"
      : variant === "error"
        ? "text-destructive border-destructive/40 bg-destructive/10"
        : "text-[hsl(var(--info))] border-[hsl(var(--info))]/40 bg-[hsl(var(--info))]/10";
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 shadow-lg backdrop-blur transition-all",
        color,
        enter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Close">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
