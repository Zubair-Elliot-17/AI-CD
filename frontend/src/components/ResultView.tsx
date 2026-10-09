// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { Cpu, FileText, Info, Type } from "lucide-react";
import type { DetectResult } from "../lib/api";
import { headlineScore, pct, VERDICT_COPY, VERDICT_STYLES } from "../lib/format";
import { Gauge } from "./Gauge";
import { HighlightedText } from "./HighlightedText";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-white/5">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function ResultView({ result }: { result: DetectResult }) {
  const copy = VERDICT_COPY[result.verdict];
  const style = VERDICT_STYLES[result.verdict];
  const scored = result.sentences.filter((s) => s.ai_probability !== null).length;
  const modelName = result.model.split("/").pop();
  const mixed = result.verdict === "mixed";

  return (
    <div className="space-y-6">
      <section className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start" aria-labelledby="verdict">
        {/* A mixed document's overall score is misleading, so show how much of it reads as AI. */}
        <Gauge
          value={headlineScore(result)}
          strokeClass={style.stroke}
          label={mixed ? "AI text" : "AI score"}
        />
        <div className="w-full min-w-0 flex-1">
          <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", style.badge)}>
            {mixed ? "Split verdict" : `${pct(result.confidence)} confidence`}
          </span>
          <h2 id="verdict" className={clsx("mt-2 font-display text-2xl font-bold sm:text-3xl", style.text)}>
            {copy.title}
          </h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{copy.blurb}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={mixed ? "Document score" : "AI-leaning text"} value={pct(mixed ? result.ai_probability : result.ai_sentence_share)} />
            <Stat label="Words" value={result.word_count.toLocaleString()} />
            <Stat label="Sentences scored" value={String(scored)} />
            <Stat label="Analysis time" value={`${(result.elapsed_ms / 1000).toFixed(1)}s`} />
          </dl>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              {result.source === "file" ? <FileText className="size-3.5" /> : <Type className="size-3.5" />}
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

      <p className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Info className="mt-px size-4 shrink-0" />
        AI detectors can produce false positives, especially on short, formal or non-native English writing.
        Use this as one signal, never as proof of misconduct.
      </p>
    </div>
  );
}
