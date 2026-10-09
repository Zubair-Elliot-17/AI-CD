// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { API_URL } from "../lib/api";
import type { ModelState } from "../lib/useModelStatus";

const mb = (bytes: number) => Math.round(bytes / 1e6);

function copy(s: ModelState) {
  switch (s.state) {
    case "checking":
      return "Starting the model…";
    case "downloading":
      return s.total
        ? `Downloading the model, ${mb(s.loaded)} of ${mb(s.total)} MB. Only the first visit needs this.`
        : "Loading the model…";
    case "waking":
      return "Waking the model server. Free hosting sleeps when idle, so this can take a minute.";
    case "ready":
      return API_URL ? "Model ready" : "Model ready. Your text never leaves this device.";
    case "offline":
      return API_URL ? "Model server is unreachable right now." : "The model couldn't load. Check your connection and reload.";
  }
}

export function ModelStatus({ status }: { status: ModelState }) {
  return (
    <div role="status" className="flex flex-col gap-1.5 text-xs text-zinc-500 sm:items-end dark:text-zinc-400">
      <p className="flex items-center gap-2">
        <span
          className={clsx(
            "size-2 shrink-0 rounded-full",
            status.state === "ready" && "bg-emerald-500",
            ["checking", "waking", "downloading"].includes(status.state) && "animate-pulse bg-amber-400",
            status.state === "offline" && "bg-rose-500",
          )}
        />
        {copy(status)}
      </p>
      {status.state === "downloading" && status.total > 0 && (
        <progress
          className="h-1 w-full overflow-hidden rounded-full sm:w-64 [&::-moz-progress-bar]:bg-brand-500 [&::-webkit-progress-bar]:bg-zinc-200 [&::-webkit-progress-value]:bg-brand-500 dark:[&::-webkit-progress-bar]:bg-white/10"
          value={status.loaded}
          max={status.total}
          aria-label="Model download progress"
        />
      )}
    </div>
  );
}
