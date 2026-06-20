/** Small presentation helpers for session statistics. */

export function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return "0s";
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function accuracyLabel(accuracy: number): string {
  if (accuracy >= 90) return "Excellent";
  if (accuracy >= 70) return "Great";
  if (accuracy >= 50) return "Good effort";
  return "Keep practicing";
}
