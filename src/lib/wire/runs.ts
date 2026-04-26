/**
 * In-memory run history. Resets on server restart.
 * Production would use Postgres. For the hackathon demo this is fine —
 * we want fresh runs to appear in the feed, not 30-day history.
 */

export type RunStatus = "running" | "success" | "failed" | "no-op";

export type Run = {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeEmoji?: string;
  startedAt: string;
  endedAt?: string;
  status: RunStatus;
  message: string;
  /** A clickable URL the user can open to inspect the artifact. */
  artifactUrl?: string;
  artifactLabel?: string;
  /** Human-readable lines describing what the agent did. */
  trace?: string[];
  error?: string;
};

// Module-level singleton, persists across requests within the same process.
const RUNS: Run[] = [];

export function appendRun(run: Run) {
  RUNS.unshift(run);
  if (RUNS.length > 50) RUNS.length = 50;
}

export function getRuns(): Run[] {
  return [...RUNS];
}

export function newRunId(): string {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
