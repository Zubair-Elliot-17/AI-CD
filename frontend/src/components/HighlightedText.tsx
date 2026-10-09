// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { useState } from "react";
import type { SentenceResult } from "../lib/api";
import { pct, sentenceTone } from "../lib/format";

const TONE_CLASS = {
  "ai-strong": "bg-rose-200/80 dark:bg-rose-500/35",
  ai: "bg-rose-100 dark:bg-rose-500/20",
  unsure: "bg-amber-100 dark:bg-amber-500/20",
  human: "bg-emerald-100/70 dark:bg-emerald-500/15",
  none: "",
} as const;

const LEGEND = [
  { tone: "ai-strong", label: "Very likely AI" },
  { tone: "ai", label: "Leans AI" },
  { tone: "unsure", label: "Unsure" },
  { tone: "human", label: "Leans human" },
] as const;

interface Props {
  text: string;
  sentences: SentenceResult[];
}

/** Renders the original text with each sentence shaded by its AI score. */
export function HighlightedText({ text, sentences }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? null : sentences[active];

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  sentences.forEach((s, i) => {
    if (s.start > cursor) parts.push(text.slice(cursor, s.start));
    const tone = sentenceTone(s.ai_probability);
    const label = s.ai_probability === null ? "Too short to score" : `${pct(s.ai_probability)} likely AI`;
    parts.push(
      <mark
        key={i}
        tabIndex={0}
        title={label}
        aria-label={`Sentence ${i + 1}: ${label}`}
        data-tone={tone}
        onMouseEnter={() => setActive(i)}
        onFocus={() => setActive(i)}
        className={clsx(
          "rounded-sm px-0.5 py-px text-inherit outline-none transition-shadow box-decoration-clone",
          TONE_CLASS[tone],
          active === i && "ring-2 ring-brand-500",
        )}
      >
        {text.slice(s.start, s.end)}
      </mark>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200/80 px-5 py-3 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
        {LEGEND.map(({ tone, label }) => (
          <span key={tone} className="flex items-center gap-1.5">
            <span className={clsx("size-3 rounded-sm ring-1 ring-black/5", TONE_CLASS[tone])} />
            {label}
          </span>
        ))}
        <span className="ml-auto min-h-4 font-medium text-ink dark:text-zinc-200" aria-live="polite">
          {current
            ? current.ai_probability === null
              ? `Sentence ${active! + 1}: too short to score`
              : `Sentence ${active! + 1}: ${pct(current.ai_probability)} likely AI`
            : "Hover a sentence for its score"}
        </span>
      </div>
      <div
        className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap px-5 py-4 leading-8 text-zinc-800 dark:text-zinc-200"
        onMouseLeave={() => setActive(null)}
      >
        {parts}
      </div>
    </div>
  );
}
