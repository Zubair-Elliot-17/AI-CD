// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, ScrollRestoration } from "react-router";
import { GitHubIcon } from "./GitHubIcon";

export const REPO_URL = "https://github.com/Zubair-Elliot-17/AI-CD";

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("aicd-theme", next ? "dark" : "light");
    } catch {
      /* storage blocked */
    }
    setDark(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="focus-ring rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "focus-ring rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-3",
    isActive
      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
      : "text-zinc-600 hover:text-ink dark:text-zinc-400 dark:hover:text-white",
  );

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-night/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:gap-2 sm:px-6">
          <Link to="/" className="focus-ring mr-auto flex items-center gap-2 rounded-lg">
            <img src="/favicon.png" alt="" className="size-8" />
            <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">AI-CD</span>
          </Link>
          <nav className="flex items-center sm:gap-1">
            <NavLink to="/detect" className={navClass}>
              Detector
            </NavLink>
            <NavLink to="/benchmarks" className={navClass}>
              Benchmarks
            </NavLink>
            <NavLink to="/history" className={navClass}>
              History
            </NavLink>
          </nav>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Source code on GitHub"
            className="focus-ring rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <GitHubIcon className="size-5" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
          <p>
            Built by Meekaaeel Booley, Mubashir Dawood &amp; Zubair Elliot · UCT CSC3003S Capstone
          </p>
          <p>Results are probabilistic. Don't treat them as proof.</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
