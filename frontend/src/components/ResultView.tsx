// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { Cpu, FileText, Info, ShieldAlert, Type } from "lucide-react";
import type { DetectResult } from "../lib/api";
import {
  headlineScore,
  pct,
  VERDICT_COPY,
  VERDICT_STYLES,
} from "../lib/format";
import { useEffect, useState } from "react";
import { HighlightedText } from "./HighlightedText";

/** Counts from 0 up to target over ~900ms; jumps straight there under reduced motion. */
function useCountUp(target: number) {
  const still =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (still) return;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 900);
      setValue(target * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, still]);
  return still ? target : value;
}

// One bar split between the two colours the highlights use: blue for human, amber for AI.
function Score({ value: raw, label }: { value: number; label: string }) {
  const value = Math.min(Math.max(raw, 0), 1);
  const shown = useCountUp(value);
  return (
    <div
      role="img"
      aria-label={`${label}: ${pct(value)}`}
      className="w-full shrink-0 sm:w-48"
    >
      <p className="font-display text-6xl font-semibold tracking-tight tabular-nums">
        {pct(shown)}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      <div className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <span
          className="rounded-l-full bg-human"
          style={{ width: `${(1 - shown) * 100}%` }}
        />
        <span className="flex-1 rounded-r-full bg-ai" />
      </div>
      <p className="mt-1.5 flex justify-between text-xs text-muted">
        <span>Human</span>
        <span>AI</span>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function TamperingNotice({
  invisible,
  homoglyphs,
}: {
  invisible: number;
  homoglyphs: number;
}) {
  const parts = [
    invisible > 0 &&
      `${invisible.toLocaleString()} invisible character${invisible === 1 ? "" : "s"}`,
    homoglyphs > 0 &&
      `${homoglyphs.toLocaleString()} look-alike letter${homoglyphs === 1 ? "" : "s"}`,
  ].filter(Boolean);
  return (
    <section
      role="alert"
      className="rise flex gap-3 rounded-lg border border-ai/40 bg-ai-wash-soft p-4 text-sm"
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-ai" />
      <div>
        <p className="font-semibold">Possible evasion attempt</p>
        <p className="mt-0.5 text-muted">
          This text contains {parts.join(" and ")}. These are a common trick for
          fooling AI detectors, so they were removed before scoring.
        </p>
      </div>
    </section>
  );
}

export function ResultView({ result }: { result: DetectResult }) {
  const copy = VERDICT_COPY[result.verdict];
  const style = VERDICT_STYLES[result.verdict];
  const scored = result.sentences.filter(
    (s) => s.ai_probability !== null,
  ).length;
  const modelName = result.model.split("/").pop();
  const mixed = result.verdict === "mixed";

  const tampering = result.tampering;

  return (
    <div className="space-y-6">
      {tampering && tampering.invisible_chars + tampering.homoglyphs > 0 && (
        <TamperingNotice
          invisible={tampering.invisible_chars}
          homoglyphs={tampering.homoglyphs}
        />
      )}
      <section
        className="rise card flex flex-col gap-8 p-6 sm:flex-row sm:p-8"
        aria-labelledby="verdict"
      >
        {/* A mixed document's overall score is misleading, so show how much of it reads as AI. */}
        <Score
          value={headlineScore(result)}
          label={mixed ? "AI text" : "AI score"}
        />
        <div className="w-full min-w-0 flex-1">
          <h2
            id="verdict"
            className={clsx(
              "font-display text-3xl font-semibold tracking-tight sm:text-4xl",
              style.text,
            )}
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-muted">{copy.blurb}</p>
          <span
            className={clsx(
              "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
              style.badge,
            )}
          >
            {mixed ? "Split verdict" : `${pct(result.confidence)} confidence`}
          </span>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
            <Stat
              label={mixed ? "Document score" : "AI-leaning text"}
              value={pct(
                mixed ? result.ai_probability : result.ai_sentence_share,
              )}
            />
            <Stat label="Words" value={result.word_count.toLocaleString()} />
            <Stat label="Sentences scored" value={String(scored)} />
            <Stat
              label="Analysis time"
              value={`${(result.elapsed_ms / 1000).toFixed(1)}s`}
            />
          </dl>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              {result.source === "file" ? (
                <FileText className="size-3.5" />
              ) : (
                <Type className="size-3.5" />
              )}
              {result.filename ?? "Pasted text"}
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="size-3.5" />
              Model: {modelName}
            </span>
          </p>
        </div>
      </section>

      <HighlightedText text={result.text} sentences={result.sentences} />

      <p className="flex gap-2 text-xs text-muted">
        <Info className="mt-px size-4 shrink-0" />
        AI detectors can produce false positives, especially on short, formal or
        non-native English writing. Use this as one signal, never as proof of
        misconduct.
      </p>
    </div>
  );
}
