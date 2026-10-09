// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import data from "../data/benchmark.json";

export interface Metrics {
  auroc: number;
  auroc_ci: [number, number];
  accuracy: number;
  f1: number;
  tpr_at_1pct_fpr: number;
  tpr: number;
  fpr: number;
}

export type Verdict = "ai" | "mixed" | "human";
export type VerdictCounts = Record<Verdict, Record<Verdict, number>>;

export interface SystemResult {
  label: string;
  model: string;
  conditions: Record<Condition, Metrics>;
  roc: [number, number][];
  histogram: { edges: number[]; human: number[]; ai: number[] };
  by_dataset: Record<string, Metrics>;
  by_generator: Record<string, { tpr: number; n: number }>;
  human_fpr_by_domain: Record<string, { fpr: number; n: number }>;
  verdicts?: Record<"calibrated" | "uncalibrated", VerdictCounts>;
  latency?: { median_ms: number; p90_ms: number };
}

export type SystemKey = "electra_2025" | "roberta_raw" | "roberta_2026";
export type Condition = "clean" | "zero_width" | "homoglyph";

export interface Benchmark {
  generated: string;
  threshold: number;
  thresholds: { ai: number; human: number; sentence: number; mixed_share: number; min_sentences: number };
  dataset: { total: number; ai: number; human: number; mixed: number; composition: Record<string, Record<string, number>> };
  systems: Record<SystemKey, SystemResult>;
}

export const benchmark = data as unknown as Benchmark;

/** Chart colour per system, as CSS variables defined in index.css. */
export const SYSTEM_COLOR: Record<SystemKey, string> = {
  roberta_2026: "var(--series-new)",
  electra_2025: "var(--series-old)",
  roberta_raw: "var(--series-raw)",
};

export const SYSTEM_SHORT: Record<SystemKey, string> = {
  roberta_2026: "2026 rebuild",
  electra_2025: "2025 capstone",
  roberta_raw: "2026, no defence",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  clean: "Clean text",
  zero_width: "Zero-width spaces",
  homoglyph: "Look-alike letters",
};

export const GENERATOR_LABEL: Record<string, string> = {
  gpt4o: "GPT-4o",
  gpt4: "GPT-4",
  "llama3-70b": "Llama 3 70B",
  "llama3-8b": "Llama 3 8B",
  "gemma2-9b-it": "Gemma 2 9B",
  "mixtral-8x7b": "Mixtral 8x7B",
};

export const DOMAIN_LABEL: Record<string, string> = {
  argument: "Persuasive essays",
  arxiv: "arXiv abstracts",
  outfox: "Student essays",
  peerread: "Peer reviews",
  reddit: "Reddit posts",
  wikihow: "WikiHow guides",
  wikipedia: "Wikipedia",
};
