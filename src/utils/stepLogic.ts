import type { Schedule, DailyStepDoc } from "../types/step";

export function getInitialTarget(schedule: Schedule): number {
  return schedule === "regular" ? 8000 : 6000;
}

export function calculateNewTarget(
  currentTarget: number,
  completedDays: number,
  schedule: Schedule
): number {
  const inc = schedule === "regular" ? 500 : 300;
  const max = schedule === "regular" ? 12000 : 9000;
  const min = schedule === "regular" ? 6000 : 5000;

  if (completedDays >= 6) {
    return Math.min(max, currentTarget + inc);
  }

  if (completedDays >= 4) {
    return currentTarget; // keep same
  }

  // less than 4
  return Math.max(min, currentTarget - inc);
}

// Calculate streak: count consecutive days (most recent first) where completed === true
export function calculateStreak(last7: DailyStepDoc[]): number {
  // Sort descending by id (YYYY-MM-DD) so most recent first
  const sorted = [...last7].sort((a, b) => (a.id < b.id ? 1 : -1));
  let streak = 0;
  for (const day of sorted) {
    if (day.completed) streak += 1;
    else break;
  }
  return streak;
}
