import type { Timestamp } from "firebase/firestore";

export type Schedule = "regular" | "hectic";

export interface UserProfile {
  schedule: Schedule;
  weeklyTarget: number;
  lastTargetUpdate?: Timestamp | null;
  createdAt?: Timestamp | null;
}

export interface DailyStep {
  steps: number;
  target: number;
  completed: boolean;
  timestamp?: Timestamp | null;
}

export interface DailyStepDoc extends DailyStep {
  id: string; // YYYY-MM-DD
}
