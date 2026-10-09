// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { ArrowLeft, FileText, History as HistoryIcon, Trash2, Type } from "lucide-react";
import { Link, useParams } from "react-router";
import { ResultView } from "../components/ResultView";
import { formatDate, headlineScore, pct, VERDICT_COPY, VERDICT_STYLES } from "../lib/format";
import { history, useHistory } from "../lib/history";

export default function History() {
  const entries = useHistory();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">History</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Saved in this browser only. Nothing is sent anywhere.</p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete all saved analyses?")) history.clear();
            }}
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-4" /> Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <HistoryIcon className="size-10 text-zinc-300 dark:text-zinc-600" />
          <p className="font-medium">No analyses yet</p>
          <Link to="/detect" className="focus-ring rounded-lg text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Run your first one
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const style = VERDICT_STYLES[e.verdict];
            return (
              <li key={e.id} className="card group relative flex items-center gap-4 p-4 transition hover:border-brand-300 dark:hover:border-brand-400/50">
                <div className={clsx("w-14 shrink-0 text-center font-display text-xl font-bold tabular-nums", style.text)}>
                  {pct(headlineScore(e))}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/history/${e.id}`} className="focus-ring rounded after:absolute after:inset-0">
                    <p className="truncate font-medium">
                      {e.source === "file" ? <FileText className="mr-1.5 inline size-4 align-[-2px]" /> : <Type className="mr-1.5 inline size-4 align-[-2px]" />}
                      {e.filename ?? e.text.slice(0, 120)}
                    </p>
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className={clsx("mr-2 rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset", style.badge)}>
                      {VERDICT_COPY[e.verdict].title}
                    </span>
                    {formatDate(e.created_at)} · {e.word_count.toLocaleString()} words
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => history.remove(e.id)}
                  aria-label="Delete this analysis"
                  className="focus-ring relative z-10 rounded-lg p-2 text-zinc-400 opacity-100 hover:bg-zinc-100 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-white/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function HistoryDetail() {
  const { id } = useParams();
  useHistory(); // re-render if the entry is deleted in another tab
  const entry = id ? history.get(id) : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/history" className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-ink dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="size-4" /> Back to history
      </Link>
      {entry ? (
        <>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Analysed {formatDate(entry.created_at)}</p>
          <ResultView result={entry} />
        </>
      ) : (
        <p className="card p-6">This analysis isn't in your history anymore.</p>
      )}
    </div>
  );
}
