export const localDateId = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
};
export const localDateIdFromDate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
};

import { onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";

export type DateId = string; // YYYY-MM-DD

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type LoggedFoodItem = {
  id: string;
  mealType: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  createdAt?: any;
};

export type DailyMetricsDoc = {
  dateId?: DateId;
  waterGlasses?: number;
  steps?: number;
  caloriesBurned?: number;
  workoutMinutes?: number;
  foodsLogged?: LoggedFoodItem[];
  nutritionTotals?: NutritionTotals;
  [key: string]: any;
};

const todayDateId = (): DateId => new Date().toISOString().slice(0, 10);

/**
 * DailyMetricsService writes non-breaking daily metrics under:
 * users/{uid}/daily/{YYYY-MM-DD}
 *
 * This is additive; it does not modify existing collections like users/{uid}/steps.
 */
export class DailyMetricsService {
  private resolveUid(explicitUid?: string) {
    return explicitUid ?? auth.currentUser?.uid;
  }

  private dailyDocRef(uid: string, dateId: DateId) {
    return doc(db, "users", uid, "daily", dateId);
  }

  async merge(uid: string, dateId: DateId, patch: Record<string, any>) {
    await setDoc(
      this.dailyDocRef(uid, dateId),
      {
        ...patch,
        updatedAt: serverTimestamp(),
        dateId,
      },
      { merge: true }
    );
  }

  async setWaterGlasses(glasses: number, dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;
    await this.merge(resolved, dateId, { waterGlasses: glasses });
  }

  async getDailyMetrics(dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return null;

    const snap = await getDoc(this.dailyDocRef(resolved, dateId));
    return (snap.exists() ? (snap.data() as DailyMetricsDoc) : null);
  }

  async setFoodsLoggedAndTotals(
    foodsLogged: LoggedFoodItem[],
    nutritionTotals: NutritionTotals,
    dateId: DateId = todayDateId(),
    uid?: string
  ) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;

    await this.merge(resolved, dateId, {
      foodsLogged,
      nutritionTotals,
    });
  }

  async setSteps(steps: number, caloriesBurned?: number, dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;
    await this.merge(resolved, dateId, {
      steps,
      ...(typeof caloriesBurned === "number" ? { caloriesBurned } : {}),
    });
  }

  async addLoggedFood(
    item: LoggedFoodItem,
    totalsDelta: NutritionTotals,
    dateId: DateId = todayDateId(),
    uid?: string
  ) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;

    // Keep a lightweight list + running totals (merge-safe).
    await setDoc(
      this.dailyDocRef(resolved, dateId),
      {
        dateId,
        updatedAt: serverTimestamp(),
        nutritionTotals: {
          calories: increment(totalsDelta.calories),
          protein: increment(totalsDelta.protein),
          carbs: increment(totalsDelta.carbs),
          fat: increment(totalsDelta.fat),
        },
        foodsLogged: arrayUnion({ ...item, createdAt: Date.now() }),
      },
      { merge: true }
    );
  }
  listenToDaily(uid: string, dateId: string, callback: (data:any)=>void) {
  return onSnapshot(
    this.dailyDocRef(uid, dateId),
    snap => {
      callback(snap.exists() ? snap.data() : null);
    }
  );
}
async calculateStreak(uid: string) {
  const col = collection(db, "users", uid, "daily");
  const snaps = await getDocs(col);

  const days = snaps.docs
    .map(d => d.data().dateId)
    .sort()
    .reverse();

  let streak = 0;
  let longest = 0;
  let prev: Date | null = null;

  for (const id of days) {
    const d = new Date(id);

    if (!prev) {
      streak = 1;
      longest = 1;
      prev = d;
      continue;
    }

    const diff =
      (prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

    if (diff <= 1.5) {
      streak++;
      longest = Math.max(longest, streak);
      prev = d;
    } else {
      break;
    }
  }

  return { streak, longest };
}
}

export default DailyMetricsService;
