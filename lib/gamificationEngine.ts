/**
 * Small encouragement helpers. Messages are picked by a deterministic seed
 * (e.g. the question index) rather than Math.random so output is stable across
 * server and client renders.
 */

const PRAISE = [
  "Great job!",
  "Excellent work!",
  "Nice one!",
  "Correct — keep going!",
  "You're on fire!",
  "Brilliant!",
];

const NUDGE = [
  "Almost there — try again!",
  "So close!",
  "Give it another go!",
  "Not quite — check the hint.",
  "Keep going, you'll get it!",
];

export function praise(seed: number): string {
  return PRAISE[Math.abs(seed) % PRAISE.length];
}

export function nudge(seed: number): string {
  return NUDGE[Math.abs(seed) % NUDGE.length];
}
