import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
    [1, "s"],
  ];
  for (const [s, label] of intervals) {
    const v = Math.floor(seconds / s);
    if (v >= 1) return `${v}${label} ago`;
  }
  return "just now";
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function pluralize(n: number, singular: string, plural?: string) {
  return n === 1 ? singular : plural || `${singular}s`;
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
