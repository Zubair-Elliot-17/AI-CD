// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

// When each step starts (ms). Pacing is theatre: the real work usually ends sooner and waits.
const STARTS = [0, 450, 900, 2200, 2800];
export const MIN_ANALYSIS_MS = 3200;

/** Elapsed ms since mount, ticking every 100ms. */
function useElapsed() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setMs(performance.now() - t0), 100);
    return () => clearInterval(id);
  }, []);
  return ms;
}

/** Rough sentence count for the progress copy; the engine does the real split. */
const estimateSentences = (text: string) => Math.max(1, text.trim().split(/(?<=[.!?])\s+/).length);

export function Analysing({ text, fileName, finishing }: { text: string; fileName?: string; finishing: boolean }) {
  const ms = useElapsed();
  const n = estimateSentences(text);
  const current = finishing ? STARTS.length : STARTS.findLastIndex((s) => ms >= s);
  // Ticks through the sentences while step 3 is on screen.
  const reading = Math.min(n, Math.max(1, Math.ceil(((ms - STARTS[2]) / (STARTS[3] - STARTS[2])) * n)));

  const steps = [
    fileName
      ? { title: `Reading ${fileName}`, detail: "Pulling the text out of the file" }
      : { title: "Cleaning the text", detail: `Checked ${text.length.toLocaleString()} characters for hidden tricks` },
    { title: "Splitting into sentences", detail: fileName ? "Finding sentence boundaries" : `${n} found` },
    { title: "Reading each sentence in context", detail: fileName ? "Scoring sentence by sentence" : `Sentence ${reading} of ${n}` },
    { title: "Scoring whole passages", detail: "About 300 words at a time" },
    { title: "Weighing the verdict", detail: "Comparing sentence and document scores" },
  ];

  return (
    <div className="card mt-4 px-5 py-4 sm:px-6">
      {/* Screen readers hear each step once, not every counter tick. */}
      <p role="status" className="sr-only">
        {finishing ? "Analysis complete" : `${steps[current].title}…`}
      </p>
      <ol aria-hidden="true" className="space-y-2.5">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={i}
              className={clsx(
                "flex items-start gap-3 text-sm transition-opacity duration-300",
                !done && !active && "opacity-40",
              )}
            >
              <span
                className={clsx(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                  done ? "border-uv bg-uv text-on-uv" : active ? "border-uv" : "border-line-strong",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : active && <span className="size-1.5 animate-pulse rounded-full bg-uv" />}
              </span>
              <span className="flex flex-1 flex-wrap justify-between gap-x-4">
                <span className={clsx("font-medium", active && "text-fg")}>{s.title}</span>
                {(done || active) && <span className="text-muted tabular-nums">{s.detail}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Progress that eases towards 94% until the work finishes, then fills. */
export function AnalysisProgress({ finishing }: { finishing: boolean }) {
  const ms = useElapsed();
  const p = finishing ? 1 : Math.min(0.94, 1 - Math.exp(-ms / 1600));
  return (
    <span aria-hidden="true" className="flex flex-1 items-center gap-3 text-xs text-muted tabular-nums">
      <span className="h-1 max-w-48 flex-1 overflow-hidden rounded-full bg-fg/10">
        <span className="block h-full rounded-full bg-uv transition-[width] duration-200 ease-linear" style={{ width: `${p * 100}%` }} />
      </span>
      {(ms / 1000).toFixed(1)}s
    </span>
  );
}
