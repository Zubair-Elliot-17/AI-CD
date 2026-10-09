// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { ArrowRight, FileUp, Highlighter, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { GitHubIcon } from "../components/GitHubIcon";
import { REPO_URL } from "../components/Layout";

const FEATURES = [
  {
    icon: Highlighter,
    title: "Sentence-level highlights",
    body: "See which sentences push the score up, not just one number for the whole document.",
  },
  {
    icon: FileUp,
    title: "PDF, Word and text files",
    body: "Drop in a document and the text is extracted in memory. Nothing is written to disk.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "The API is stateless. Your history stays in your own browser and the server keeps nothing.",
  },
];

const STEPS = [
  ["Split", "Text is split into sentences with character offsets, so highlights map back onto the original exactly."],
  ["Score", "Each sentence is scored together with its neighbours, and ~300-word passages are scored for the whole-document verdict, all in one batched pass."],
  ["Classify", "A RoBERTa-base transformer fine-tuned to tell human writing from LLM output returns P(AI) for every input."],
  ["Explain", "Scores roll up into a verdict. If the sentences clearly split between human and AI, the result is flagged as mixed."],
] as const;

const STACK = ["React 19", "TypeScript", "Tailwind CSS v4", "Vite", "FastAPI", "PyTorch", "Hugging Face Transformers", "Docker", "GitHub Actions", "Vitest + Pytest"];

const TEAM = ["Meekaaeel Booley", "Mubashir Dawood", "Zubair Elliot"];

function DemoCard() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left text-sm leading-7 text-zinc-200 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
        <span>Mixed sample</span>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300">Mixed signals</span>
      </div>
      <p>
        <mark className="rounded-sm bg-emerald-500/20 px-0.5 text-inherit">Took way longer than it should've because the chain tool I bought was the wrong size, classic.</mark>{" "}
        <mark className="rounded-sm bg-emerald-500/20 px-0.5 text-inherit">Anyway the gears still skip a bit but it rides.</mark>{" "}
        <mark className="rounded-sm bg-rose-500/35 px-0.5 text-inherit">Regular bicycle maintenance is essential for ensuring both safety and performance.</mark>{" "}
        <mark className="rounded-sm bg-rose-500/35 px-0.5 text-inherit">Ultimately, investing a small amount of time in maintenance can lead to a smoother, more enjoyable cycling experience.</mark>
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-night text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(217,70,239,0.18),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">Machine learning capstone project</p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Human or <span className="bg-gradient-to-r from-brand-300 to-fuchsia-400 bg-clip-text text-transparent">AI?</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-zinc-300">
              Paste any text or upload a document. A fine-tuned transformer scores every sentence and shows you where the writing sounds like it came from a language model.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/detect" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-400">
                Try the detector <ArrowRight className="size-4" />
              </Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                <GitHubIcon className="size-4" /> View source
              </a>
            </div>
          </div>
          <DemoCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <Icon className="size-6 text-brand-600 dark:text-brand-300" />
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200/70 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="font-display text-sm font-bold text-brand-600 dark:text-brand-300">0{i + 1}</span>
                <h3 className="mt-1 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Built with</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <li key={s} className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700 dark:border-white/15 dark:text-zinc-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">The team</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Built as our final-year CSC3003S capstone at the University of Cape Town. The original version (2025) ran a fine-tuned ELECTRA model on Flask and AWS. In 2026 it was rebuilt with FastAPI, TypeScript and a newer detector.
          </p>
          <ul className="mt-4 space-y-1 font-medium">
            {TEAM.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
