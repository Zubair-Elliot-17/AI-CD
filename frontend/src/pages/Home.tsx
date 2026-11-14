// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { GitHubIcon } from "../components/GitHubIcon";
import { REPO_URL } from "../components/Layout";
import { benchmark } from "../lib/benchmark";
import { pct } from "../lib/format";

// Four sentences from the detector's mixed sample: a person wrote the first two, a model the last two.
const SPECIMEN = [
  { ai: false, text: "Took way longer than it should've because the chain tool I bought was the wrong size, classic." },
  { ai: false, text: "Anyway the gears still skip a bit on the big cog but it rides." },
  { ai: true, text: "Regular bicycle maintenance is essential for ensuring both safety and performance." },
  { ai: true, text: "Ultimately, investing a small amount of time in maintenance can lead to a smoother, more enjoyable cycling experience." },
];

const FEATURES = [
  {
    title: "Sentence-level highlights",
    body: "See which sentences push the score up, not just one number for the whole document.",
  },
  {
    title: "Catches evasion tricks",
    body: "Invisible characters and look-alike letters are stripped before scoring, and you're told they were there.",
  },
  {
    title: "PDF, Word and text files",
    body: "Drop in a document and the text is pulled out right in your browser. Nothing is uploaded.",
  },
  {
    title: "Runs on your device",
    body: "The model runs in your browser with WebAssembly. Your text never leaves your device, and there's no server to wait for.",
  },
];

const STEPS = [
  ["Split", "Text is split into sentences with character offsets, so highlights map back onto the original exactly."],
  ["Score", "Each sentence is scored together with its neighbours, and ~300-word passages are scored for the whole-document verdict, all in one batched pass."],
  ["Classify", "A RoBERTa-base transformer, quantized to 8 bits and run in a Web Worker, returns P(AI) for every input."],
  ["Explain", "Scores roll up into a verdict. If the sentences clearly split between human and AI, the result is flagged as mixed."],
] as const;

const STACK = ["React 19", "TypeScript", "Tailwind CSS v4", "Vite", "Transformers.js", "ONNX Runtime Web", "FastAPI", "PyTorch", "scikit-learn", "Docker", "GitHub Actions", "Vitest", "Pytest"];

const { systems, dataset } = benchmark;

function correct(kind: "human" | "ai", run: "calibrated" | "uncalibrated" = "calibrated") {
  const row = systems.roberta_2026.verdicts![run][kind];
  return row[kind] / (row.ai + row.mixed + row.human);
}
const auroc = (n: number) => n.toFixed(2);

// Each claim compared with the baseline it improves on, both drawn on a 0–1 scale.
const RESULTS = [
  {
    label: `AUROC on ${dataset.total.toLocaleString()} held-out texts`,
    value: systems.roberta_2026.conditions.clean.auroc,
    format: auroc,
    base: systems.electra_2025.conditions.clean.auroc,
    baseLabel: "2025 model",
  },
  {
    label: "Human writing judged human",
    value: correct("human"),
    format: pct,
    base: correct("human", "uncalibrated"),
    baseLabel: "Before threshold calibration",
  },
  {
    label: "AUROC under a look-alike letter attack",
    value: systems.roberta_2026.conditions.homoglyph.auroc,
    format: auroc,
    base: systems.roberta_raw.conditions.homoglyph.auroc,
    baseLabel: "Undefended model",
  },
];

const TEAM = ["Meekaaeel Booley", "Mubashir Dawood", "Zubair Elliot"];

/** The specimen under a UV lamp: one beam pass reveals which sentences a model wrote. */
function Specimen() {
  const [run, setRun] = useState(0);
  const text = "font-display text-[clamp(1.35rem,0.9rem+1.9vw,2.35rem)] leading-[1.45] tracking-[-0.01em]";
  return (
    <figure>
      <div key={run} className="uv-stage card relative overflow-hidden px-5 py-7 sm:px-10 sm:py-10">
        <p className={`uv-dim text-muted ${text}`}>{SPECIMEN.map((s) => s.text).join(" ")}</p>
        <p aria-hidden="true" className={`uv-reveal absolute inset-0 px-5 py-7 sm:px-10 sm:py-10 ${text}`}>
          {SPECIMEN.map((s, i) => (
            <span key={s.text}>
              {i > 0 && " "}
              <span className={s.ai ? "uv-ai" : "uv-human"}>{s.text}</span>
            </span>
          ))}
        </p>
        <div aria-hidden="true" className="uv-beam pointer-events-none absolute inset-y-0 w-24 -translate-x-1/2">
          <div className="absolute inset-0 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--uv)_28%,transparent),transparent)]" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-uv shadow-[0_0_14px_2px_var(--uv)]" />
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-human" /> Written by a person
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-ai" /> Written by a language model
        </span>
        <span className="basis-full sm:basis-auto sm:flex-1">Four sentences from the detector's mixed sample.</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-fg hover:bg-fg/[0.07] motion-reduce:hidden"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Scan again
        </button>
      </figcaption>
    </figure>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <div className="mt-8 md:mt-10">{children}</div>
    </section>
  );
}

// Visual only: both numbers are also written out as text.
function Bar({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-fg/[0.07]">
      <div className={strong ? "h-full rounded-full bg-uv" : "h-full rounded-full bg-muted/50"} style={{ width: `${value * 100}%` }} />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-16">
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-end lg:gap-14">
          <h1 className="font-display text-[clamp(2.4rem,1.5rem+3.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.025em]">
            Find the sentences a language model wrote.
          </h1>
          <div>
            <p className="max-w-md text-lg text-muted">
              Paste text or drop in a document. A fine-tuned transformer reads every sentence in your browser and marks the ones that look machine-written.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/detect" className="focus-ring btn">
                Check your own text
              </Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="focus-ring btn-ghost">
                <GitHubIcon className="size-4" /> View source
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 md:mt-16">
          <Specimen />
        </div>
      </section>

      <div className="border-y border-line bg-surface/60">
        <Section title="How it performs">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            {RESULTS.map((r) => (
              <div key={r.label}>
                <p className="font-display text-6xl font-semibold tabular-nums tracking-tight">{r.format(r.value)}</p>
                <p className="mt-2 font-medium">{r.label}</p>
                <div className="mt-5 space-y-2">
                  <Bar value={r.value} strong />
                  <Bar value={r.base} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {r.baseLabel}: <span className="tabular-nums">{r.format(r.base)}</span>
                </p>
              </div>
            ))}
          </div>
          <Link to="/benchmarks" className="focus-ring mt-10 inline-block rounded font-semibold underline decoration-uv decoration-2 underline-offset-4">
            See the full evaluation
          </Link>
        </Section>
      </div>

      <Section title="How it works">
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="border-t border-line-strong pt-5">
              <span aria-hidden="true" className="font-display text-4xl font-medium text-uv tabular-nums">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What it does">
        <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {FEATURES.map(({ title, body }) => (
            <div key={title}>
              <dt className="text-lg font-semibold">{title}</dt>
              <dd className="mt-1.5 max-w-prose text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="border-t border-line">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">The team</h2>
            <p className="mt-4 max-w-prose text-muted">
              Built as our final-year CSC3003S capstone at the University of Cape Town. The original version (2025) ran a fine-tuned ELECTRA model on Flask and AWS. In 2026 it was rebuilt with TypeScript and a newer detector that runs entirely in the browser, with a FastAPI backend kept for the API and the benchmark.
            </p>
            <ul className="mt-4 space-y-1 font-medium">
              {TEAM.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Built with</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {STACK.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 text-sm text-muted">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
