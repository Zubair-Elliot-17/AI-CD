// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { FileUp, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import {
  AnalysisProgress,
  Analysing,
  MIN_ANALYSIS_MS,
} from "../components/Analysing";
import { ResultView } from "../components/ResultView";
import { ModelStatus } from "../components/ModelStatus";
import { api, ApiError, type DetectResult } from "../lib/api";
import { countWords } from "../lib/format";
import { history } from "../lib/history";
import { SAMPLES } from "../lib/samples";
import { useModelStatus } from "../lib/useModelStatus";

const ACCEPT = ".pdf,.docx,.txt,.md";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Detect() {
  const { status, limits } = useModelStatus();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const words = countWords(text);
  const tooLong = text.length > limits.max_chars;
  const canSubmit =
    !busy && (file !== null || (words >= limits.min_words && !tooLong));

  function attach(f: File | undefined) {
    if (!f || busy) return;
    setError(null);
    if (f.size > limits.max_file_bytes) {
      setError(
        `That file is too large. The limit is ${(limits.max_file_bytes / 1e6).toLocaleString()} MB.`,
      );
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
    setResult(null);
    try {
      // Hold the result back so the analysis steps can play; errors still reject straight away.
      const [res] = await Promise.all([
        file ? api.detectFile(file) : api.detectText(text),
        wait(MIN_ANALYSIS_MS),
      ]);
      setFinishing(true);
      await wait(450);
      setResult(res);
      history.add(res);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ block: "start" }),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
      setFinishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Check a piece of writing
          </h1>
          <p className="mt-1.5 text-muted">
            Paste some writing or drop in a document.
          </p>
        </div>
        <ModelStatus status={status} />
      </div>

      <div
        className={clsx(
          "card relative overflow-hidden transition-colors",
          dragging && "border-uv bg-uv/[0.06]",
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
            <FileUp className="size-10 text-muted" aria-hidden="true" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted">
                {(file.size / 1000).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={busy}
              className="focus-ring inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-fg/[0.07] hover:text-fg disabled:opacity-40"
            >
              <X className="size-4" aria-hidden="true" /> Remove file
            </button>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Paste an essay, article or email here…"
            aria-label="Text to analyse"
            className={clsx(
              "block min-h-64 w-full resize-y bg-transparent p-5 font-serif text-[1.125rem] leading-8 outline-none transition-opacity placeholder:font-sans placeholder:text-base placeholder:text-muted sm:px-7",
              busy && "opacity-60",
            )}
          />
        )}

        {busy && (
          <div
            aria-hidden="true"
            className="scan-sweep pointer-events-none absolute inset-0"
          />
        )}

        {dragging && !busy && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium text-fg">
            Drop to upload
          </div>
        )}

        <div className="relative flex flex-wrap items-center gap-3 border-t border-line bg-surface px-4 py-3">
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
            disabled={busy}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-fg/[0.07] hover:text-fg disabled:opacity-40"
          >
            <FileUp className="size-4" aria-hidden="true" /> Upload file
          </button>
          {busy ? (
            <AnalysisProgress finishing={finishing} />
          ) : (
            !file && (
              <span
                className={clsx(
                  "text-xs tabular-nums",
                  tooLong ? "text-danger" : "text-muted",
                )}
              >
                {words.toLocaleString()} words, {text.length.toLocaleString()}/
                {limits.max_chars.toLocaleString()} characters
              </span>
            )
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="focus-ring btn ml-auto text-sm"
          >
            {busy ? "Analysing…" : "Analyse"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Try:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setFile(null);
              setText(s.text);
              setError(null);
            }}
            disabled={busy}
            className="focus-ring rounded-full border border-line-strong px-3 py-1 text-muted transition-colors hover:border-uv hover:text-fg disabled:opacity-40"
          >
            {s.label}
          </button>
        ))}
        {!file && words > 0 && words < limits.min_words && (
          <span className="ml-auto text-xs text-muted">
            Needs at least {limits.min_words} words
          </span>
        )}
      </div>

      {busy && (
        <Analysing text={text} fileName={file?.name} finishing={finishing} />
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div ref={resultRef} className="scroll-mt-24 pt-8">
        {result && <ResultView result={result} />}
      </div>
    </div>
  );
}
