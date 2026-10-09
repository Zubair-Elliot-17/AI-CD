// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

// The in-browser detector: same pipeline as the FastAPI backend, with the model in a Web Worker.

import type { DetectResult } from "../api";
import { analyse, BROWSER_THRESHOLDS } from "./analysis";
import { extractText, FileError } from "./files";
import { normalize } from "./normalize";
import type { FromWorker } from "./protocol";

export const LIMITS = { min_words: 10, max_chars: 50_000, max_file_bytes: 5_000_000 };

export type EngineStatus =
  | { state: "idle" }
  | { state: "loading"; loaded: number; total: number }
  | { state: "ready" }
  | { state: "error"; message: string };

export class EngineError extends Error {}

let worker: Worker | null = null;
let status: EngineStatus = { state: "idle" };
const listeners = new Set<(s: EngineStatus) => void>();
const pending = new Map<number, { resolve: (s: number[]) => void; reject: (e: Error) => void }>();
let nextId = 0;

function setStatus(s: EngineStatus) {
  status = s;
  listeners.forEach((l) => l(s));
}

function onMessage({ data }: MessageEvent<FromWorker>) {
  if (data.type === "progress") setStatus({ state: "loading", loaded: data.loaded, total: data.total });
  else if (data.type === "ready") setStatus({ state: "ready" });
  else if (data.type === "scores") {
    pending.get(data.id)?.resolve(data.scores);
    pending.delete(data.id);
  } else if (data.id === undefined) {
    setStatus({ state: "error", message: data.message });
  } else {
    pending.get(data.id)?.reject(new EngineError(data.message));
    pending.delete(data.id);
  }
}

export const engine = {
  get status() {
    return status;
  },

  subscribe(listener: (s: EngineStatus) => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },

  /** Start downloading the model. Safe to call repeatedly; the browser caches the weights. */
  load() {
    if (status.state === "loading" || status.state === "ready") return;
    if (!worker) {
      worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = onMessage;
    }
    setStatus({ state: "loading", loaded: 0, total: 0 });
    worker.postMessage({ type: "load" });
  },

  predict(texts: string[]): Promise<number[]> {
    this.load();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker!.postMessage({ type: "predict", id, texts });
    });
  },
};

export async function detectText(input: string, source: "text" | "file" = "text", filename: string | null = null): Promise<DetectResult> {
  const { text, tampering } = normalize(input.trim());
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < LIMITS.min_words) throw new EngineError(`Text must be at least ${LIMITS.min_words} words long.`);
  if (text.length > LIMITS.max_chars) throw new EngineError(`Text must be under ${LIMITS.max_chars.toLocaleString()} characters.`);

  const started = performance.now();
  const a = await analyse(text, (t) => engine.predict(t), BROWSER_THRESHOLDS);
  const round = (x: number) => Math.round(x * 10_000) / 10_000;
  return {
    id: crypto.randomUUID(),
    verdict: a.verdict,
    ai_probability: round(a.ai_probability),
    confidence: round(a.confidence),
    ai_sentence_share: round(a.ai_sentence_share),
    word_count: a.word_count,
    char_count: text.length,
    sentences: a.sentences.map((s) => ({ ...s, ai_probability: s.ai_probability === null ? null : round(s.ai_probability) })),
    text,
    source,
    filename,
    model: "fakespot-ai/roberta-base-ai-text-detection-v1 (8-bit, in browser)",
    tampering,
    elapsed_ms: Math.round(performance.now() - started),
  };
}

export async function detectFile(file: File): Promise<DetectResult> {
  if (file.size > LIMITS.max_file_bytes) {
    throw new EngineError(`File is too large. The limit is ${LIMITS.max_file_bytes / 1_000_000} MB.`);
  }
  let text: string;
  try {
    text = await extractText(file);
  } catch (err) {
    throw err instanceof FileError ? new EngineError(err.message) : err;
  }
  if (!text) throw new EngineError("No readable text found in that file.");
  return detectText(text, "file", file.name);
}
