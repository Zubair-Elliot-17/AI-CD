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

// Blue is human and amber is AI everywhere; a mixed verdict takes neither side.
export const VERDICT_STYLES: Record<Verdict, { text: string; badge: string }> = {
  ai: { text: "text-ai", badge: "bg-ai-wash-soft text-ai ring-ai/40" },
  mixed: { text: "text-fg", badge: "bg-unsure-wash text-fg ring-line-strong" },
  human: { text: "text-human", badge: "bg-human-wash/60 text-human ring-human/40" },
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

/** The headline number: AI share of the text for mixed results, document score otherwise. */
export function headlineScore(r: { verdict: Verdict; ai_probability: number; ai_sentence_share: number }) {
  return r.verdict === "mixed" ? r.ai_sentence_share : r.ai_probability;
}
