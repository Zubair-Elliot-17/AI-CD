// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { FileUp, Loader2, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { ResultView } from "../components/ResultView";
import { ModelStatus } from "../components/ModelStatus";
import { api, ApiError, type DetectResult } from "../lib/api";
import { countWords } from "../lib/format";
import { history } from "../lib/history";
import { SAMPLES } from "../lib/samples";
import { useModelStatus } from "../lib/useModelStatus";

const ACCEPT = ".pdf,.docx,.txt,.md";

export default function Detect() {
  const { status, limits } = useModelStatus();

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
      setError(`That file is too large. The limit is ${(limits.max_file_bytes / 1e6).toLocaleString()} MB.`);
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
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start" }));
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Check a piece of writing</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Paste some writing or drop in a document.</p>
        </div>
        <ModelStatus status={status} />
      </div>

      <div
        className={clsx(
          "card relative transition-colors",
          dragging && "border-ink bg-brand-50 dark:border-white dark:bg-white/[0.06]",
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
            <FileUp className="size-10 text-zinc-400" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-zinc-500">{(file.size / 1000).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="focus-ring inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-white/10"
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
            className="block min-h-64 w-full resize-y rounded-md bg-transparent p-5 font-serif text-[1.0625rem] leading-8 outline-none placeholder:font-sans placeholder:text-base placeholder:text-zinc-400 sm:px-7"
          />
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md text-lg font-medium text-ink dark:text-white">
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
            className="focus-ring inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <FileUp className="size-4" /> Upload file
          </button>
          {!file && (
            <span className={clsx("text-xs tabular-nums", tooLong ? "text-rose-600" : "text-zinc-500")}>
              {words.toLocaleString()} words, {text.length.toLocaleString()}/{limits.max_chars.toLocaleString()} characters
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="focus-ring btn ml-auto text-sm"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
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
            className="focus-ring rounded-md border border-zinc-300 px-3 py-1 text-zinc-700 hover:border-ink hover:text-ink dark:border-white/15 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white"
          >
            {s.label}
          </button>
        ))}
        {!file && words > 0 && words < limits.min_words && (
          <span className="ml-auto text-xs text-zinc-500">Needs at least {limits.min_words} words</span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      <div ref={resultRef} className="scroll-mt-24 pt-8">
        {result && <ResultView result={result} />}
      </div>
    </div>
  );
}
