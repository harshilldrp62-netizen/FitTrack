import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { localDateIdFromDate } from "@/services/DailyMetricsService";

export type WeeklyStepPoint = {
  day: string;
  steps: number;
};

class StepHistoryService {
  private stepsRef(uid: string, dateId: string) {
    return doc(db, "users", uid, "steps", dateId);
  }

  private toSafeNumber(value: unknown): number {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
  }

  async saveSteps(uid: string, dateId: string, steps: number): Promise<void> {
    const safeSteps = this.toSafeNumber(steps);
    const calories = Number((safeSteps * 0.04).toFixed(2));

    await setDoc(
      this.stepsRef(uid, dateId),
      {
        steps: safeSteps,
        calories,
        date: dateId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async getWeeklySteps(uid: string): Promise<WeeklyStepPoint[]> {
    const days: WeeklyStepPoint[] = [];
    let hasFirebaseData = false;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dateId = localDateIdFromDate(date);
      const snap = await getDoc(this.stepsRef(uid, dateId));
      const value = snap.exists() ? this.toSafeNumber(snap.data()?.steps) : 0;
      if (snap.exists()) hasFirebaseData = true;

      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        steps: value,
      });
    }

    // Let UI fall back to local cached week if user has no step docs yet.
    return hasFirebaseData ? days : [];
  }
}

export default StepHistoryService;
