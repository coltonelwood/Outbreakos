"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, id, label, className }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-sm transition-colors hover:bg-card/60",
        checked && "border-primary/60 bg-primary/10",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border",
          checked && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
