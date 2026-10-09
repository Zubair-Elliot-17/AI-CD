// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

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

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

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

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/api/health", { signal }),

  detectText: (text: string, signal?: AbortSignal) =>
    request<DetectResult>("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    }),

  detectFile: (file: File, signal?: AbortSignal) => {
    const body = new FormData();
    body.append("file", file);
    return request<DetectResult>("/api/detect/file", { method: "POST", body, signal });
  },
};
