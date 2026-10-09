// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { BarChart, Histogram, Legend, RocChart, TableView } from "../components/charts";
import { REPO_URL } from "../components/Layout";
import {
  benchmark,
  CONDITION_LABEL,
  DOMAIN_LABEL,
  GENERATOR_LABEL,
  SYSTEM_COLOR,
  SYSTEM_SHORT,
  type Condition,
  type SystemKey,
} from "../lib/benchmark";
import onnx from "../data/onnx.json";
import { pct } from "../lib/format";

type Counts = Record<"ai" | "mixed" | "human", Record<"ai" | "mixed" | "human", number>>;
const share = (c: Counts, actual: keyof Counts, verdict: keyof Counts) => {
  const row = c[actual];
  return pct(row[verdict] / (row.ai + row.mixed + row.human));
};
const BROWSER_ROWS: [string, (c: Counts) => string][] = [
  ["Human writing judged human", (c) => share(c, "human", "human")],
  ["Human writing called AI", (c) => share(c, "human", "ai")],
  ["AI writing called AI", (c) => share(c, "ai", "ai")],
  ["Mixed documents called mixed", (c) => share(c, "mixed", "mixed")],
];

const SYSTEMS: SystemKey[] = ["roberta_2026", "roberta_raw", "electra_2025"];
const CONDITIONS: Condition[] = ["clean", "zero_width", "homoglyph"];
const { systems, dataset } = benchmark;
const now = systems.roberta_2026;
const then = systems.electra_2025;
const raw = systems.roberta_raw;

const auc = (v: number) => v.toFixed(3);

const ACTUAL_LABEL = {
  ai: "AI-generated",
  human: "Human-written",
  mixed: "Mixed (human + AI passage)",
} as const;

function Stat({ label, value, note }: { label: string; value: string; note: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>
    </div>
  );
}

function Section({ title, lede, children }: { title: string; lede: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{lede}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function generatorName(g: string) {
  return GENERATOR_LABEL[g] ?? g;
}

export default function Benchmarks() {
  const worstAttack = (s: typeof now) => Math.min(...CONDITIONS.map((c) => s.conditions[c].auroc));
  const generators = Object.keys(now.by_generator).sort(
    (a, b) => now.by_generator[b].tpr - now.by_generator[a].tpr,
  );
  const domains = Object.keys(now.human_fpr_by_domain).sort(
    (a, b) => now.human_fpr_by_domain[b].fpr - now.human_fpr_by_domain[a].fpr,
  );
  const histMax = Math.max(...now.histogram.human, ...now.histogram.ai);
  const v = now.verdicts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
        Evaluation
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">How accurate is it?</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        We tested the original 2025 capstone model and the 2026 rebuild on the same{" "}
        {dataset.total.toLocaleString()} texts: {dataset.ai.toLocaleString()} written by{" "}
        {Object.values(dataset.composition).reduce((n, g) => n + Object.keys(g).length - 1, 0)} different language
        models and {dataset.human.toLocaleString()} written by people. None of it was used to train either model, as far as
        we can verify.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="AUROC, clean text"
          value={auc(now.conditions.clean.auroc)}
          note={<>Up from {auc(then.conditions.clean.auroc)} for the 2025 model. 1.0 is perfect, 0.5 is a coin flip.</>}
        />
        <Stat
          label="Human texts wrongly flagged as AI"
          value={pct(now.conditions.clean.fpr)}
          note={<>At the app's {pct(benchmark.threshold)} threshold. The 2025 model flagged {pct(then.conditions.clean.fpr)}.</>}
        />
        <Stat
          label="Worst AUROC under attack"
          value={auc(worstAttack(now))}
          note={<>Without the input clean-up, the same model drops to {auc(worstAttack(raw))}.</>}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Section
          title="Catching AI text without accusing people"
          lede="Each curve shows how much AI text a detector catches (up) against how many human texts it wrongly flags (right). The closer a curve hugs the top-left corner, the better. Hover to compare at any false-positive rate."
        >
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,440px)_1fr]">
            <div className="min-w-0">
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">AI texts caught</p>
              <RocChart
                series={(["roberta_2026", "electra_2025"] as const).map((k) => ({
                  key: k,
                  label: SYSTEM_SHORT[k],
                  color: SYSTEM_COLOR[k],
                  points: systems[k].roc,
                }))}
              />
            </div>
            <div className="space-y-4">
              <Legend
                items={(["roberta_2026", "electra_2025"] as const).map((k) => ({
                  label: `${SYSTEM_SHORT[k]} (${systems[k].model})`,
                  color: SYSTEM_COLOR[k],
                  line: true,
                }))}
              />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {(["roberta_2026", "electra_2025"] as const).map((k) => (
                  <div key={k} className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">{SYSTEM_SHORT[k]}</dt>
                    <dd className="mt-1 space-y-0.5 tabular-nums">
                      <p>
                        AUROC <strong>{auc(systems[k].conditions.clean.auroc)}</strong>{" "}
                        <span className="text-xs text-zinc-500">
                          ({auc(systems[k].conditions.clean.auroc_ci[0])}–{auc(systems[k].conditions.clean.auroc_ci[1])})
                        </span>
                      </p>
                      <p>
                        Accuracy <strong>{pct(systems[k].conditions.clean.accuracy)}</strong>
                      </p>
                      <p>
                        Caught at 1% FPR <strong>{pct(systems[k].conditions.clean.tpr_at_1pct_fpr)}</strong>
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ranges are 95% bootstrap confidence intervals. "Caught at 1% FPR" is the share of AI text detected when
                the threshold is set so only 1 in 100 human texts is flagged.
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Robustness to evasion tricks"
          lede={
            <>
              A common way to fool detectors is to hide invisible zero-width characters in the text or swap letters for
              identical-looking Cyrillic ones. The rebuild strips these before scoring and tells the user it found them.
              Here, half the characters in every AI text were attacked.
            </>
          }
        >
          <Legend items={SYSTEMS.map((k) => ({ label: SYSTEM_SHORT[k], color: SYSTEM_COLOR[k] }))} />
          <div className="mt-3">
            <BarChart
              valueLabel={auc}
              rows={CONDITIONS.map((c) => ({
                label: CONDITION_LABEL[c],
                values: SYSTEMS.map((k) => ({
                  key: k,
                  label: SYSTEM_SHORT[k],
                  color: SYSTEM_COLOR[k],
                  value: systems[k].conditions[c].auroc,
                })),
              }))}
            />
          </div>
          <TableView
            head={["AUROC", ...SYSTEMS.map((k) => SYSTEM_SHORT[k])]}
            rows={CONDITIONS.map((c) => [CONDITION_LABEL[c], ...SYSTEMS.map((k) => auc(systems[k].conditions[c].auroc))])}
          />
        </Section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section
            title="Detection rate by model"
            lede={`Share of each model's text the rebuild flags as AI at the ${pct(benchmark.threshold)} threshold.`}
          >
            <BarChart
              rows={generators.map((g) => ({
                label: generatorName(g),
                values: [{ key: g, label: SYSTEM_SHORT.roberta_2026, color: SYSTEM_COLOR.roberta_2026, value: now.by_generator[g].tpr }],
              }))}
            />
            <TableView
              head={["Model", "Texts", SYSTEM_SHORT.roberta_2026, SYSTEM_SHORT.electra_2025]}
              rows={generators.map((g) => [
                generatorName(g),
                now.by_generator[g].n,
                pct(now.by_generator[g].tpr),
                pct(then.by_generator[g].tpr),
              ])}
            />
          </Section>

          <Section
            title="How confident the scores are"
            lede="Distribution of the rebuild's AI score. A good detector pushes the two groups to opposite ends."
          >
            <div className="space-y-4">
              {(["human", "ai"] as const).map((cls) => (
                <div key={cls}>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="size-2.5 rounded-sm" style={{ background: `var(--class-${cls})` }} />
                    {cls === "human" ? `Human-written (${dataset.human.toLocaleString()})` : `AI-generated (${dataset.ai.toLocaleString()})`}
                  </p>
                  <Histogram
                    counts={now.histogram[cls]}
                    edges={now.histogram.edges}
                    color={`var(--class-${cls})`}
                    label={cls === "human" ? "Human texts" : "AI texts"}
                    max={histMax}
                  />
                </div>
              ))}
            </div>
            <TableView
              head={["AI score", "Human", "AI"]}
              rows={now.histogram.human.map((h, i) => [
                `${pct(now.histogram.edges[i])}–${pct(now.histogram.edges[i + 1])}`,
                h,
                now.histogram.ai[i],
              ])}
            />
          </Section>
        </div>

        <Section
          title="Where it gets it wrong"
          lede={`Share of human writing flagged as AI at the ${pct(benchmark.threshold)} threshold, by source. Formal and persuasive writing is where both models struggle most.`}
        >
          <Legend items={(["roberta_2026", "electra_2025"] as const).map((k) => ({ label: SYSTEM_SHORT[k], color: SYSTEM_COLOR[k] }))} />
          <div className="mt-3">
            <BarChart
              rows={domains.map((d) => ({
                label: DOMAIN_LABEL[d] ?? d,
                values: (["roberta_2026", "electra_2025"] as const).map((k) => ({
                  key: k,
                  label: SYSTEM_SHORT[k],
                  color: SYSTEM_COLOR[k],
                  value: systems[k].human_fpr_by_domain[d].fpr,
                })),
              }))}
            />
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            The persuasive essays were written by paid crowdworkers in 2023. Studies from that year found many crowdworkers
            already used LLMs, so some of these "human" texts may not be. We report them anyway.
          </p>
          <TableView
            head={["Source", "Texts", SYSTEM_SHORT.roberta_2026, SYSTEM_SHORT.electra_2025]}
            rows={domains.map((d) => [
              DOMAIN_LABEL[d] ?? d,
              now.human_fpr_by_domain[d].n,
              pct(now.human_fpr_by_domain[d].fpr),
              pct(then.human_fpr_by_domain[d].fpr),
            ])}
          />
        </Section>

        {v && (
          <Section
            title="What users actually see"
            lede={
              <>
                The full pipeline gives every text one of three verdicts. To test the mixed verdict we added{" "}
                {dataset.mixed} documents where an AI passage was pasted into human writing. The verdict cut-offs were
                tuned on a separate calibration set drawn from a different split, never on these texts.
              </>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm tabular-nums">
                <thead className="text-xs text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Actual</th>
                    <th className="py-2 pr-4 font-medium">Verdict: AI</th>
                    <th className="py-2 pr-4 font-medium">Verdict: mixed</th>
                    <th className="py-2 pr-4 font-medium">Verdict: human</th>
                    <th className="py-2 pr-4 font-medium">Correct before calibration</th>
                  </tr>
                </thead>
                <tbody>
                  {(["ai", "human", "mixed"] as const).map((actual) => {
                    const row = v.calibrated[actual];
                    const before = v.uncalibrated[actual];
                    const total = row.ai + row.mixed + row.human;
                    return (
                      <tr key={actual} className="border-t border-zinc-100 dark:border-white/5">
                        <td className="py-2 pr-4 font-medium">{ACTUAL_LABEL[actual]}</td>
                        {(["ai", "mixed", "human"] as const).map((verdict) => (
                          <td
                            key={verdict}
                            className={verdict === actual ? "py-2 pr-4 font-semibold" : "py-2 pr-4 text-zinc-600 dark:text-zinc-400"}
                          >
                            {pct(row[verdict] / total)}{" "}
                            <span className="text-xs font-normal text-zinc-400">({row[verdict].toLocaleString()})</span>
                          </td>
                        ))}
                        <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{pct(before[actual] / total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Before calibration the sentence-level check was too eager and called most human writing mixed. Raising the
              cut-offs to match how confident the model's scores really are fixed that. The trade-off is that more AI
              text now gets the cautious mixed verdict instead of AI, which we think is the right call for a tool that
              could be used to accuse someone.
            </p>
          </Section>
        )}

        <Section
          title="The model in your browser"
          lede={
            <>
              The live site runs an 8-bit quantized copy of the model (125 MB instead of 500 MB) so it can work without a
              server. Quantizing nudges its scores up, so it got its own cut-offs, tuned the same way on the calibration
              set.
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm tabular-nums">
              <thead className="text-xs text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-4 font-medium" />
                  <th className="py-2 pr-4 font-medium">Full precision</th>
                  <th className="py-2 pr-4 font-medium">8-bit, original cut-offs</th>
                  <th className="py-2 pr-4 font-medium">8-bit, own cut-offs (live)</th>
                </tr>
              </thead>
              <tbody>
                {BROWSER_ROWS.map(([label, f]) => (
                  <tr key={label} className="border-t border-zinc-100 dark:border-white/5">
                    <td className="py-2 pr-4 font-medium">{label}</td>
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{f(onnx.pytorch.verdicts)}</td>
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{f(onnx.onnx_q8.verdicts)}</td>
                    <td className="py-2 pr-4 font-semibold">{f(onnx.onnx_q8.verdicts_tuned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            AUROC is {onnx.onnx_q8.clean.auroc.toFixed(3)} for the 8-bit model and {onnx.pytorch.clean.auroc.toFixed(3)} at
            full precision, so it ranks texts just as well. Script:{" "}
            <a className="underline" href={`${REPO_URL}/blob/main/backend/eval/onnx_check.py`}>eval/onnx_check.py</a>.
          </p>
        </Section>

        <Section title="Method and caveats" lede="How the numbers above were produced, and where they don't apply.">
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>Data.</strong> Human and Claude-written arguments for the same claims from{" "}
              <a className="underline" href="https://huggingface.co/datasets/Anthropic/persuasion">Anthropic/persuasion</a>, which the
              detector's authors explicitly held out from training. Also GPT-4o, GPT-4, Llama 3, Gemma 2 and Mixtral text from the{" "}
              <a className="underline" href="https://huggingface.co/datasets/Jinyan1/COLING_2025_MGT_en">COLING 2025 shared task</a>,
              with human texts drawn from the same domains (arXiv, Reddit, Wikipedia, WikiHow, peer reviews) in the same
              proportions. Texts are 60 to 600 words.
            </li>
            <li>
              <strong>Scoring.</strong> Each text goes through the same splitting and passage scoring as the live API. AUROC
              is threshold-free. Accuracy and F1 use 50%, and flag rates use the app's {pct(benchmark.threshold)}.
            </li>
            <li>
              <strong>Caveats.</strong> The COLING data reuses older public datasets, so some of it may overlap with what the
              2026 model was trained on. Paraphrasing tools and heavy human editing aren't tested here, and both are known to
              weaken every current detector. Treat results as one signal, never as proof.
            </li>
            <li>
              <strong>Reproduce it.</strong> <code className="text-xs">uv run --group eval python -m eval.build</code> then{" "}
              <code className="text-xs">python -m eval.run</code> in <code className="text-xs">backend/</code>. Code in{" "}
              <a className="underline" href={`${REPO_URL}/tree/main/backend/eval`}>backend/eval</a>. Last run{" "}
              {benchmark.generated}.
            </li>
          </ul>
        </Section>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/detect"
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Try the detector <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
