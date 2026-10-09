// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { ACTIVE_THRESHOLDS, type Verdict } from "./api";

export const pct = (p: number) => `${Math.round(p * 100)}%`;

export const VERDICT_COPY: Record<Verdict, { title: string; blurb: string }> = {
  ai: {
    title: "Likely AI-generated",
    blurb: "The writing has strong statistical signs of a language model.",
  },
  mixed: {
    title: "Mixed signals",
    blurb: "Some passages read as AI and others as human. Check the highlights below.",
  },
  human: {
    title: "Likely human-written",
    blurb: "The writing looks like a person wrote it.",
  },
};

export const VERDICT_STYLES: Record<Verdict, { text: string; badge: string; stroke: string }> = {
  ai: {
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    stroke: "stroke-rose-500",
  },
  mixed: {
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    stroke: "stroke-amber-500",
  },
  human: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    stroke: "stroke-emerald-500",
  },
};

/**
 * Highlight bucket for one sentence's AI probability. Only "ai-strong" sentences count
 * towards the AI-leaning share, so its cut-off follows the active thresholds.
 */
export function sentenceTone(
  p: number | null,
  strong = ACTIVE_THRESHOLDS.sentence,
): "ai-strong" | "ai" | "unsure" | "human" | "none" {
  if (p === null) return "none";
  if (p >= strong) return "ai-strong";
  if (p >= 0.9) return "ai";
  if (p > 0.5) return "unsure";
  return "human";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** The number shown on the dial: AI share of the text for mixed results, document score otherwise. */
export function headlineScore(r: { verdict: Verdict; ai_probability: number; ai_sentence_share: number }) {
  return r.verdict === "mixed" ? r.ai_sentence_share : r.ai_probability;
}
