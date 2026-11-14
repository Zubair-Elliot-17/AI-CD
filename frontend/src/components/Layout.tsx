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
      className="focus-ring rounded-full p-2 text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "focus-ring rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
    isActive ? "bg-uv/15 text-fg" : "text-muted hover:text-fg",
  );

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:gap-2 sm:px-6">
          <Link to="/" aria-label="AI-CD home" className="focus-ring mr-auto flex items-center gap-2 rounded-md">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="hidden font-display text-xl font-semibold tracking-tight sm:inline">AI-CD</span>
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
            className="focus-ring rounded-full p-2 text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg"
          >
            <GitHubIcon className="size-5" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Built by Meekaaeel Booley, Mubashir Dawood and Zubair Elliot for the UCT CSC3003S capstone.
          </p>
          <p>Results are probabilistic. Don't treat them as proof.</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
