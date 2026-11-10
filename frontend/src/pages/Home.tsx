// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { GitHubIcon } from "../components/GitHubIcon";
import { REPO_URL } from "../components/Layout";
import { benchmark } from "../lib/benchmark";
import { pct } from "../lib/format";

// Four sentences from the detector's mixed sample, marked the way a real result marks them.
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
const RESULTS = [
  {
    value: systems.roberta_2026.conditions.clean.auroc.toFixed(2),
    label: `AUROC on ${dataset.total.toLocaleString()} held-out texts`,
    note: `vs ${systems.electra_2025.conditions.clean.auroc.toFixed(2)} for the 2025 model`,
  },
  {
    value: pct(correct("human")),
    label: "of human writing judged human",
    note: `up from ${pct(correct("human", "uncalibrated"))} before threshold calibration`,
  },
  {
    value: systems.roberta_2026.conditions.homoglyph.auroc.toFixed(2),
    label: "AUROC under a look-alike letter attack",
    note: `the undefended model falls to ${systems.roberta_raw.conditions.homoglyph.auroc.toFixed(2)}`,
  },
];

const TEAM = ["Meekaaeel Booley", "Mubashir Dawood", "Zubair Elliot"];

function Specimen() {
  return (
    <figure className="card">
      <div className="divide-y divide-zinc-200 dark:divide-white/10">
        {SPECIMEN.map(({ ai, text }) => (
          <p key={text} className="grid gap-x-5 gap-y-1 px-5 py-3.5 sm:grid-cols-[1fr_7.5rem] sm:px-6">
            <span className="font-serif text-[1.0625rem] leading-8">
              <mark
                className={clsx(
                  "rounded-sm box-decoration-clone px-0.5 text-inherit",
                  ai ? "bg-ai-200 dark:bg-ai-500/45" : "bg-human-100 dark:bg-human-500/25",
                )}
              >
                {text}
              </mark>
            </span>
            <span
              className={clsx(
                "text-sm font-semibold sm:pt-1.5",
                ai ? "text-ai-700 dark:text-ai-300" : "text-human-700 dark:text-human-300",
              )}
            >
              {ai ? "Very likely AI" : "Leans human"}
            </span>
          </p>
        ))}
      </div>
      <figcaption className="border-t border-zinc-200 px-5 py-3 text-sm text-zinc-500 sm:px-6 dark:border-white/10 dark:text-zinc-400">
        From the detector's mixed sample: a person wrote the first two sentences, a language model the last two.
      </figcaption>
    </figure>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-zinc-300/70 dark:border-white/10">
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-6 px-4 py-12 sm:px-6 md:grid-cols-[14rem_1fr] md:py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <div>{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[5fr_6fr] lg:items-center lg:gap-14 lg:py-20">
        <div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            See which sentences sound like a language model
          </h1>
          <p className="mt-5 max-w-lg text-lg text-zinc-600 dark:text-zinc-300">
            Paste any text or upload a document. A fine-tuned transformer scores every sentence in your browser and marks the ones that read as machine-written.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/detect" className="focus-ring btn">
              Check your own text
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-2.5 font-semibold transition-colors hover:border-ink dark:border-white/20 dark:hover:border-white"
            >
              <GitHubIcon className="size-4" /> View source
            </a>
          </div>
        </div>
        <Specimen />
      </section>

      <Block title="How it performs">
        <div className="grid gap-8 sm:grid-cols-3">
          {RESULTS.map((r) => (
            <div key={r.label}>
              <p className="font-display text-5xl font-bold tabular-nums">{r.value}</p>
              <p className="mt-2 font-medium">{r.label}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{r.note}</p>
            </div>
          ))}
        </div>
        <Link to="/benchmarks" className="focus-ring mt-8 inline-block rounded font-semibold underline underline-offset-4">
          See the full evaluation
        </Link>
      </Block>

      <Block title="What it does">
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map(({ title, body }) => (
            <div key={title}>
              <dt className="font-display text-lg font-semibold">{title}</dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">{body}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="How it works">
        <ol className="max-w-2xl list-decimal space-y-4 pl-5 marker:font-semibold">
          {STEPS.map(([title, body]) => (
            <li key={title} className="pl-1">
              <span className="font-semibold">{title}.</span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">{body}</span>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Built with">
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          {new Intl.ListFormat("en", { type: "conjunction" }).format(STACK)}.
        </p>
      </Block>

      <Block title="The team">
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Built as our final-year CSC3003S capstone at the University of Cape Town. The original version (2025) ran a fine-tuned ELECTRA model on Flask and AWS. In 2026 it was rebuilt with TypeScript and a newer detector that runs entirely in the browser, with a FastAPI backend kept for the API and the benchmark.
        </p>
        <ul className="mt-4 space-y-1 font-medium">
          {TEAM.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Block>
    </>
  );
}
