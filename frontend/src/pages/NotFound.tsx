// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-500">404</p>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">That page doesn't exist.</p>
      <Link to="/" className="focus-ring mt-6 rounded-lg font-semibold text-brand-600 hover:underline dark:text-brand-300">
        Go home
      </Link>
    </div>
  );
}
