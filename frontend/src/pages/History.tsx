// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { ArrowLeft, FileText, Trash2, Type } from "lucide-react";
import { Link, useParams } from "react-router";
import { ResultView } from "../components/ResultView";
import {
  formatDate,
  headlineScore,
  pct,
  VERDICT_COPY,
  VERDICT_STYLES,
} from "../lib/format";
import { history, useHistory } from "../lib/history";

export default function History() {
  const entries = useHistory();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            History
          </h1>
          <p className="mt-1 text-muted">
            Saved in this browser only. Nothing is sent anywhere.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete all saved analyses?")) history.clear();
            }}
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <Trash2 className="size-4" /> Clear all
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card flex flex-col items-start gap-4 p-6 sm:p-8">
          <p className="max-w-md text-muted">
            Nothing checked yet. Each text you analyse is kept here so you can
            come back to its highlights.
          </p>
          <Link to="/detect" className="focus-ring btn text-sm">
            Check a piece of writing
          </Link>
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {entries.map((e) => {
            const style = VERDICT_STYLES[e.verdict];
            return (
              <li
                key={e.id}
                className="group relative flex items-center gap-4 p-4 transition-colors hover:bg-fg/[0.03]"
              >
                <div
                  className={clsx(
                    "w-14 shrink-0 text-center font-display text-xl font-semibold tabular-nums",
                    style.text,
                  )}
                >
                  {pct(headlineScore(e))}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/history/${e.id}`}
                    className="focus-ring rounded after:absolute after:inset-0"
                  >
                    <p className="truncate font-medium">
                      {e.source === "file" ? (
                        <FileText className="mr-1.5 inline size-4 align-[-2px]" />
                      ) : (
                        <Type className="mr-1.5 inline size-4 align-[-2px]" />
                      )}
                      {e.filename ?? e.text.slice(0, 120)}
                    </p>
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    <span
                      className={clsx(
                        "mr-2 rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset",
                        style.badge,
                      )}
                    >
                      {VERDICT_COPY[e.verdict].title}
                    </span>
                    {formatDate(e.created_at)}, {e.word_count.toLocaleString()}{" "}
                    words
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => history.remove(e.id)}
                  aria-label="Delete this analysis"
                  className="focus-ring relative z-10 rounded-full p-2 text-muted opacity-100 hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
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
      <Link
        to="/history"
        className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Back to history
      </Link>
      {entry ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Analysed {formatDate(entry.created_at)}
          </p>
          <ResultView result={entry} />
        </>
      ) : (
        <p className="card p-6">This analysis isn't in your history anymore.</p>
      )}
    </div>
  );
}
