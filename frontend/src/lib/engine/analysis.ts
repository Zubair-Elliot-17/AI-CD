// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

// Port of backend/app/analysis.py and clean_text from detector.py. Keep them in step:
// parity.test.ts checks this file against outputs recorded from the Python code.

import type { SentenceResult, Verdict } from "../api";

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "e.g", "i.e", "fig",
  "no", "vol", "approx", "inc", "ltd", "co", "u.s", "u.k", "a.m", "p.m",
]); // prettier-ignore

// A boundary is .!? (plus closing quotes/brackets) followed by whitespace, or a line break.
const BOUNDARY = /(?<=[.!?])["')\]]*\s+|\n+/g;
const WORD = /\S+/g;
const MIN_SCORABLE_WORDS = 4;
const CHUNK_WORDS = 300;

/** Verdict cut-offs for the full-precision model, tuned by backend/eval/calibrate.py. */
export const THRESHOLDS = { ai: 0.95, human: 0.5, sentence: 0.99, mixed_share: 0.35, min_sentences: 8 };

/** Cut-offs for the 8-bit browser model (eval/calibrate.py --onnx, see calibration_q8.json). */
export const BROWSER_THRESHOLDS = { ai: 0.99, human: 0.7, sentence: 0.95, mixed_share: 0.3, min_sentences: 8 };

export type Predict = (texts: string[]) => Promise<number[]>;

interface Span {
  start: number;
  end: number;
  text: string;
}

export interface Analysis {
  ai_probability: number;
  verdict: Verdict;
  confidence: number;
  word_count: number;
  sentences: SentenceResult[];
  ai_sentence_share: number;
}

export const wordCount = (text: string) => text.match(WORD)?.length ?? 0;

const stripChars = (s: string, chars: string, side: "start" | "end") => {
  let i = side === "start" ? 0 : s.length;
  if (side === "start") while (i < s.length && chars.includes(s[i])) i++;
  else while (i > 0 && chars.includes(s[i - 1])) i--;
  return side === "start" ? s.slice(i) : s.slice(0, i);
};

function endsWithAbbreviation(candidate: string) {
  const last = candidate.trim() ? candidate.trim().split(/\s+/).pop()! : "";
  const token = stripChars(stripChars(last, ".\"')]", "end"), "\"'([", "start").toLowerCase();
  return ABBREVIATIONS.has(token) || (Array.from(token).length === 1 && /\p{L}/u.test(token));
}

function appendSpan(spans: Span[], text: string, start: number, end: number) {
  const raw = text.slice(start, end);
  const stripped = raw.trim();
  if (!stripped) return;
  const s = start + (raw.length - raw.trimStart().length);
  spans.push({ start: s, end: s + stripped.length, text: stripped });
}

export function splitSentences(text: string): Span[] {
  const spans: Span[] = [];
  let start = 0;
  for (const m of text.matchAll(BOUNDARY)) {
    const candidate = text.slice(start, m.index).trimEnd();
    if (!m[0].includes("\n") && endsWithAbbreviation(candidate)) continue;
    appendSpan(spans, text, start, m.index + m[0].length);
    start = m.index + m[0].length;
  }
  appendSpan(spans, text, start, text.length);
  return spans;
}

/** Group consecutive sentences into ~300-word passages for the document score. */
export function passages(spans: Span[]): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  for (const span of spans) {
    const n = wordCount(span.text);
    if (current.length && words + n > CHUNK_WORDS) {
      chunks.push(current.join(" "));
      current = [];
      words = 0;
    }
    current.push(span.text);
    words += n;
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

export function verdictFor(probability: number, share: number, scored: number, t = THRESHOLDS): Verdict {
  // A document score can't see a human essay with an AI paragraph pasted in.
  if (scored >= t.min_sentences && t.mixed_share < share && share < 1 - t.mixed_share) return "mixed";
  if (probability >= t.ai) return "ai";
  if (probability <= t.human) return "human";
  return "mixed";
}

export async function analyse(text: string, predict: Predict, t = THRESHOLDS): Promise<Analysis> {
  const spans = splitSentences(text);
  const scorable = spans.flatMap((s, i) => (wordCount(s.text) >= MIN_SCORABLE_WORDS ? [i] : []));
  // Each sentence is scored with its neighbours so single short lines aren't judged blind.
  const windows = scorable.map((i) => spans.slice(Math.max(0, i - 1), i + 2).map((s) => s.text).join(" "));
  const chunks = passages(spans);
  const probs = await predict([...chunks, ...windows]);

  const weights = chunks.map(wordCount);
  const total = weights.reduce((a, b) => a + b, 0);
  const overall = chunks.reduce((sum, _, i) => sum + probs[i] * weights[i], 0) / Math.max(total, 1);

  const byIndex = new Map(scorable.map((i, k) => [i, probs[chunks.length + k]]));
  const sentences = spans.map((s, i) => ({ ...s, ai_probability: byIndex.get(i) ?? null }));

  let scoredWords = 0;
  let aiWords = 0;
  for (const s of sentences) {
    if (s.ai_probability === null) continue;
    const n = wordCount(s.text);
    scoredWords += n;
    if (s.ai_probability >= t.sentence) aiWords += n;
  }
  const share = scoredWords ? aiWords / scoredWords : 0;

  return {
    ai_probability: overall,
    verdict: verdictFor(overall, share, scorable.length, t),
    confidence: Math.abs(overall - 0.5) * 2,
    word_count: wordCount(text),
    sentences,
    ai_sentence_share: share,
  };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };

function unescapeHtml(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Strip markdown/HTML noise the way the Fakespot model was trained. */
export function cleanText(input: string): string {
  let text = input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(?<![\p{L}\p{N}_])(\*|_)(.+?)\1(?![\p{L}\p{N}_])/gu, "$2")
    .replace(/^#+ /gm, "")
    .replace(/^(\s*[-*+]|\d+\.)\s+/gm, "")
    .replace(/<.*?>/g, "");
  text = unescapeHtml(text).replace(/\s+/g, " ").replaceAll(" ,", ",");
  return text.trim();
}
