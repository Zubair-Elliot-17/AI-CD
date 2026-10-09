// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { ResultView } from "../components/ResultView";
import { ServerStatus } from "../components/ServerStatus";
import { api, ApiError, type DetectResult } from "../lib/api";
import { countWords } from "../lib/format";
import { history } from "../lib/history";
import { SAMPLES } from "../lib/samples";
import { useServerStatus } from "../lib/useServerStatus";

const ACCEPT = ".pdf,.docx,.txt,.md";
const DEFAULT_LIMITS = { min_words: 10, max_chars: 50_000, max_file_bytes: 1_000_000 };

export default function Detect() {
  const { state: serverState, health } = useServerStatus();
  const limits = health ?? DEFAULT_LIMITS;

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const words = countWords(text);
  const tooLong = text.length > limits.max_chars;
  const canSubmit = !busy && (file !== null || (words >= limits.min_words && !tooLong));

  function attach(f: File | undefined) {
    if (!f) return;
    setError(null);
    if (f.size > limits.max_file_bytes) {
      setError(`That file is too large. The limit is ${Math.round(limits.max_file_bytes / 1000)} KB.`);
      return;
    }
    setFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    attach(e.dataTransfer.files[0]);
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = file ? await api.detectFile(file) : await api.detectText(text);
      setResult(res);
      history.add(res);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">AI Text Detector</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Paste some writing or drop in a document.</p>
        </div>
        <ServerStatus state={serverState} />
      </div>

      <div
        className={clsx(
          "card relative transition-colors",
          dragging && "border-brand-400 bg-brand-50/60 dark:border-brand-400 dark:bg-brand-500/10",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {file ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <FileUp className="size-10 text-brand-500" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-zinc-500">{(file.size / 1000).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <X className="size-4" /> Remove file
            </button>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Paste an essay, article or email here…"
            aria-label="Text to analyse"
            className="block min-h-64 w-full resize-y rounded-2xl bg-transparent p-5 leading-7 outline-none placeholder:text-zinc-400"
          />
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl text-lg font-medium text-brand-700 dark:text-brand-200">
            Drop to upload
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200/80 px-4 py-3 dark:border-white/10">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              attach(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <FileUp className="size-4" /> Upload file
          </button>
          {!file && (
            <span className={clsx("text-xs tabular-nums", tooLong ? "text-rose-600" : "text-zinc-500")}>
              {words.toLocaleString()} words · {text.length.toLocaleString()}/{limits.max_chars.toLocaleString()} chars
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="focus-ring ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Analysing…" : "Analyse"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Try:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setFile(null);
              setText(s.text);
              setError(null);
            }}
            className="focus-ring rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 hover:border-brand-300 hover:text-brand-700 dark:border-white/15 dark:text-zinc-300 dark:hover:border-brand-400 dark:hover:text-brand-200"
          >
            {s.label}
          </button>
        ))}
        {!file && words > 0 && words < limits.min_words && (
          <span className="ml-auto text-xs text-zinc-500">Needs at least {limits.min_words} words</span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      <div ref={resultRef} className="scroll-mt-24 pt-8">
        {result && <ResultView result={result} />}
      </div>
    </div>
  );
}
