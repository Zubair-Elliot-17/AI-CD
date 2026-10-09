// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { detectFile, detectText, EngineError } from "./engine";
import { BROWSER_THRESHOLDS, THRESHOLDS } from "./engine/analysis";

export type Verdict = "ai" | "mixed" | "human";

export interface SentenceResult {
  start: number;
  end: number;
  text: string;
  ai_probability: number | null;
}

export interface DetectResult {
  id: string;
  verdict: Verdict;
  ai_probability: number;
  confidence: number;
  ai_sentence_share: number;
  word_count: number;
  char_count: number;
  sentences: SentenceResult[];
  text: string;
  source: "text" | "file";
  filename: string | null;
  model: string;
  /** Missing on history saved before this field existed. */
  tampering?: { invisible_chars: number; homoglyphs: number };
  elapsed_ms: number;
}

export interface Health {
  status: "ok" | "loading";
  model: string;
  min_words: number;
  max_chars: number;
  max_file_bytes: number;
  supported_extensions: string[];
}

/** Set VITE_API_URL to use the FastAPI backend; otherwise the model runs in the browser. */
export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || null;

/** The verdict cut-offs behind the results this build shows. */
export const ACTIVE_THRESHOLDS = API_URL ? THRESHOLDS : BROWSER_THRESHOLDS;

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError("Can't reach the detection server. It may be waking up, so try again in a moment.", 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

async function local<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof EngineError) throw new ApiError(err.message, 400);
    throw new ApiError("The model couldn't run in this browser. Try reloading the page.", 500);
  }
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/api/health", { signal }),

  detectText: (text: string, signal?: AbortSignal) =>
    API_URL
      ? request<DetectResult>("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal,
        })
      : local(() => detectText(text)),

  detectFile: (file: File, signal?: AbortSignal) => {
    if (!API_URL) return local(() => detectFile(file));
    const body = new FormData();
    body.append("file", file);
    return request<DetectResult>("/api/detect/file", { method: "POST", body, signal });
  },
};
