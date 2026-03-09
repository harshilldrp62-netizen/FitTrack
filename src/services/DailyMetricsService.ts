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
  limit,
  orderBy,
  query,
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
  caloriesConsumed?: number;
  caloriesTarget?: number;
  waterGlasses?: number;
  waterGoal?: number;
  steps?: number;
  caloriesBurned?: number;
  workoutCompleted?: boolean;
  workoutMinutes?: number;
  streakQualified?: boolean;
  foodsLogged?: LoggedFoodItem[];
  nutritionTotals?: NutritionTotals;
  [key: string]: any;
};

export type ProgressDoc = {
  dateId: DateId;
  calorieIntake: number;
  workoutMinutes?: number;
  workoutsCompleted: number;
  dailyTargetCalories: number;
  timestamp?: any;
};

const todayDateId = (): DateId => localDateId().toString();
const DEFAULT_CALORIES_TARGET = 2000;
const DEFAULT_WATER_GOAL = 8;
const REST_DAY_INDEXES = new Set([0, 4]); // Sun, Thu

export const evaluateDailyStreak = (dailyDoc: DailyMetricsDoc | null | undefined): boolean => {
  const dateId = String(dailyDoc?.dateId ?? "");
  const date = dateId ? new Date(`${dateId}T00:00:00`) : null;
  const isRestDay = date ? REST_DAY_INDEXES.has(date.getDay()) : false;
  const workoutCompleted = Boolean(dailyDoc?.workoutCompleted ?? false);
  const workoutCondition = isRestDay ? true : workoutCompleted;

  const foodsLoggedCount = Array.isArray(dailyDoc?.foodsLogged) ? dailyDoc!.foodsLogged!.length : 0;
  const safeCaloriesConsumed = Number(dailyDoc?.caloriesConsumed ?? dailyDoc?.nutritionTotals?.calories ?? 0) || 0;
  const foodLogged = foodsLoggedCount > 0 || safeCaloriesConsumed > 0;

  const safeWaterGlasses = Number(dailyDoc?.waterGlasses ?? 0) || 0;
  const safeWaterGoal = Number(dailyDoc?.waterGoal ?? DEFAULT_WATER_GOAL) || DEFAULT_WATER_GOAL;
  const waterCompleted = safeWaterGlasses >= safeWaterGoal;

  return workoutCondition && foodLogged && waterCompleted;
};

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

  private progressDocRef(uid: string, dateId: DateId) {
    return doc(db, "users", uid, "progress", dateId);
  }

  private toProgressPatch(dateId: DateId, dailyDoc: DailyMetricsDoc): Omit<ProgressDoc, "timestamp"> {
    const calorieIntake = Math.max(
      0,
      Number(dailyDoc?.caloriesConsumed ?? dailyDoc?.nutritionTotals?.calories ?? 0) || 0
    );
    const dailyTargetCalories = Math.max(
      0,
      Number(dailyDoc?.caloriesTarget ?? DEFAULT_CALORIES_TARGET) || DEFAULT_CALORIES_TARGET
    );
    const workoutsCompleted =
      typeof dailyDoc?.workoutsCompleted === "number"
        ? Math.max(0, Math.round(Number(dailyDoc.workoutsCompleted) || 0))
        : dailyDoc?.workoutCompleted
          ? 1
          : 0;
    const workoutMinutes = Math.max(0, Number(dailyDoc?.workoutMinutes ?? 0) || 0);

    return {
      dateId,
      calorieIntake,
      workoutMinutes,
      workoutsCompleted,
      dailyTargetCalories,
    };
  }

  private async syncProgressDoc(uid: string, dateId: DateId, dailyDoc: DailyMetricsDoc) {
    await setDoc(
      this.progressDocRef(uid, dateId),
      {
        ...this.toProgressPatch(dateId, dailyDoc),
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async updateUserStreakStats(uid: string) {
    const { streak, longest } = await this.calculateStreak(uid);
    await setDoc(
      doc(db, "users", uid),
      {
        currentStreak: streak,
        longestStreak: longest,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async mergeAndEvaluate(uid: string, dateId: DateId, patch: Record<string, any>) {
    const snap = await getDoc(this.dailyDocRef(uid, dateId));
    const existing = snap.exists() ? (snap.data() as DailyMetricsDoc) : {};
    const mergedDoc: DailyMetricsDoc = {
      ...existing,
      ...patch,
    };

    if (typeof mergedDoc.caloriesConsumed !== "number") {
      mergedDoc.caloriesConsumed = Number(mergedDoc.nutritionTotals?.calories ?? 0) || 0;
    }
    if (typeof mergedDoc.caloriesTarget !== "number") {
      mergedDoc.caloriesTarget = DEFAULT_CALORIES_TARGET;
    }
    if (typeof mergedDoc.waterGlasses !== "number") {
      mergedDoc.waterGlasses = 0;
    }
    if (typeof mergedDoc.waterGoal !== "number") {
      mergedDoc.waterGoal = DEFAULT_WATER_GOAL;
    }
    if (typeof mergedDoc.workoutMinutes !== "number") {
      mergedDoc.workoutMinutes = 0;
    }
    if (typeof mergedDoc.workoutCompleted !== "boolean") {
      mergedDoc.workoutCompleted = false;
    }

    const streakQualified = evaluateDailyStreak(mergedDoc);
    await setDoc(
      this.dailyDocRef(uid, dateId),
      {
        ...patch,
        caloriesConsumed: Number(mergedDoc.caloriesConsumed ?? 0) || 0,
        caloriesTarget: Number(mergedDoc.caloriesTarget ?? DEFAULT_CALORIES_TARGET) || DEFAULT_CALORIES_TARGET,
        waterGlasses: Number(mergedDoc.waterGlasses ?? 0) || 0,
        waterGoal: Number(mergedDoc.waterGoal ?? DEFAULT_WATER_GOAL) || DEFAULT_WATER_GOAL,
        workoutCompleted: Boolean(mergedDoc.workoutCompleted ?? false),
        workoutMinutes: Number(mergedDoc.workoutMinutes ?? 0) || 0,
        streakQualified,
        dateId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await this.syncProgressDoc(uid, dateId, mergedDoc);

    await this.updateUserStreakStats(uid);
  }

  async merge(uid: string, dateId: DateId, patch: Record<string, any>) {
    await this.mergeAndEvaluate(uid, dateId, patch);
  }

  async setWaterGlasses(glasses: number, dateId: DateId = todayDateId(), uid?: string, waterGoal: number = DEFAULT_WATER_GOAL) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;
    await this.merge(resolved, dateId, {
      waterGlasses: Math.max(0, Number(glasses) || 0),
      waterGoal: Math.max(1, Number(waterGoal) || DEFAULT_WATER_GOAL),
    });
  }

  async getDailyMetrics(dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return null;

    const snap = await getDoc(this.dailyDocRef(resolved, dateId));
    return (snap.exists() ? (snap.data() as DailyMetricsDoc) : null);
  }

  async getProgressMetrics(dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return null;
    const snap = await getDoc(this.progressDocRef(resolved, dateId));
    if (!snap.exists()) return null;
    const row = snap.data() as Record<string, any>;
    return {
      dateId: String(row?.dateId ?? dateId),
      calorieIntake: Math.max(0, Number(row?.calorieIntake ?? 0) || 0),
      workoutMinutes: Math.max(0, Number(row?.workoutMinutes ?? 0) || 0),
      workoutsCompleted: Math.max(0, Number(row?.workoutsCompleted ?? 0) || 0),
      dailyTargetCalories: Math.max(0, Number(row?.dailyTargetCalories ?? DEFAULT_CALORIES_TARGET) || DEFAULT_CALORIES_TARGET),
      timestamp: row?.timestamp,
    } as ProgressDoc;
  }

  listenToProgress(uid: string, dateId: string, callback: (data: any) => void) {
    return onSnapshot(
      this.progressDocRef(uid, dateId),
      (snap) => {
        callback(snap.exists() ? snap.data() : null);
      }
    );
  }

  async setFoodsLoggedAndTotals(
    foodsLogged: LoggedFoodItem[],
    nutritionTotals: NutritionTotals,
    dateId: DateId = todayDateId(),
    uid?: string
  ) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;

    const safeTotals: NutritionTotals = {
      calories: Math.max(0, Number(nutritionTotals?.calories ?? 0) || 0),
      protein: Math.max(0, Number(nutritionTotals?.protein ?? 0) || 0),
      carbs: Math.max(0, Number(nutritionTotals?.carbs ?? 0) || 0),
      fat: Math.max(0, Number(nutritionTotals?.fat ?? 0) || 0),
    };
    await this.merge(resolved, dateId, {
      foodsLogged,
      nutritionTotals: safeTotals,
      caloriesConsumed: safeTotals.calories,
    });
    console.debug("CaloriesDebug", `Firestore stored calories: ${safeTotals.calories}`);
  }

  async setSteps(steps: number, caloriesBurned?: number, dateId: DateId = todayDateId(), uid?: string) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;
    await setDoc(
      this.dailyDocRef(resolved, dateId),
      {
        steps: Math.max(0, Number(steps) || 0),
        dateId,
        updatedAt: serverTimestamp(),
        ...(typeof caloriesBurned === "number" ? { caloriesBurned } : {}),
      },
      { merge: true }
    );
  }

  async addLoggedFood(
    item: LoggedFoodItem,
    totalsDelta: NutritionTotals,
    dateId: DateId = todayDateId(),
    uid?: string
  ) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;

    const snap = await getDoc(this.dailyDocRef(resolved, dateId));
    const existing = snap.exists() ? (snap.data() as DailyMetricsDoc) : {};
    const existingFoods = Array.isArray(existing?.foodsLogged) ? (existing.foodsLogged as LoggedFoodItem[]) : [];
    // Prevent duplicate addition for the same food log id.
    const alreadyLogged = existingFoods.some((food) => String(food?.id ?? "") === String(item?.id ?? ""));
    if (alreadyLogged) {
      return;
    }

    const nextFoods: LoggedFoodItem[] = [...existingFoods, { ...item, createdAt: Date.now() }];
    const existingTotals = existing.nutritionTotals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const foodCalories = Math.max(0, Math.round(Number(totalsDelta?.calories ?? 0) || 0));
    const nextTotals: NutritionTotals = {
      calories: Math.max(0, Math.round(Number(existingTotals.calories ?? existing.caloriesConsumed ?? 0) || 0) + foodCalories),
      protein: Math.max(0, Math.round(Number(existingTotals.protein ?? 0) || 0) + Math.max(0, Math.round(Number(totalsDelta?.protein ?? 0) || 0))),
      carbs: Math.max(0, Math.round(Number(existingTotals.carbs ?? 0) || 0) + Math.max(0, Math.round(Number(totalsDelta?.carbs ?? 0) || 0))),
      fat: Math.max(0, Math.round(Number(existingTotals.fat ?? 0) || 0) + Math.max(0, Math.round(Number(totalsDelta?.fat ?? 0) || 0))),
    };
    await this.merge(resolved, dateId, {
      nutritionTotals: nextTotals,
      caloriesConsumed: nextTotals.calories,
      foodsLogged: nextFoods,
    });
    console.debug("FoodLog", `Food calories: ${foodCalories}`);
    console.debug("FoodLog", `Firestore updated daily calories: ${nextTotals.calories}`);
  }

  async setWorkoutCompletion(
    durationSeconds: number,
    completed: boolean,
    dateId: DateId = todayDateId(),
    uid?: string
  ) {
    const resolved = this.resolveUid(uid);
    if (!resolved) return;
    const safeDuration = Math.max(0, Number(durationSeconds) || 0);
    const snap = await getDoc(this.dailyDocRef(resolved, dateId));
    const existing = snap.exists() ? (snap.data() as DailyMetricsDoc) : {};
    const existingMinutes = Number(existing.workoutMinutes ?? 0) || 0;
    const minutes = completed ? existingMinutes + safeDuration / 60 : 0;
    await this.merge(resolved, dateId, {
      workoutCompleted: Boolean(completed),
      workoutsCompleted: completed ? 1 : 0,
      workoutMinutes: minutes,
    });
  }
  async getRecentProgress(uid: string, days: number = 7): Promise<ProgressDoc[]> {
    const snap = await getDocs(
      query(
        collection(db, "users", uid, "progress"),
        orderBy("timestamp", "desc"),
        limit(Math.max(1, Math.floor(days)))
      )
    );
    return snap.docs.map((d) => {
      const row = d.data() as Record<string, any>;
      return {
        dateId: String(row?.dateId ?? d.id),
        calorieIntake: Math.max(0, Number(row?.calorieIntake ?? 0) || 0),
        workoutMinutes: Math.max(0, Number(row?.workoutMinutes ?? 0) || 0),
        workoutsCompleted: Math.max(0, Number(row?.workoutsCompleted ?? 0) || 0),
        dailyTargetCalories: Math.max(
          0,
          Number(row?.dailyTargetCalories ?? DEFAULT_CALORIES_TARGET) || DEFAULT_CALORIES_TARGET
        ),
        timestamp: row?.timestamp,
      };
    });
  }

  async getAllProgress(uid: string): Promise<ProgressDoc[]> {
    const snap = await getDocs(collection(db, "users", uid, "progress"));
    return snap.docs.map((d) => {
      const row = d.data() as Record<string, any>;
      return {
        dateId: String(row?.dateId ?? d.id),
        calorieIntake: Math.max(0, Number(row?.calorieIntake ?? 0) || 0),
        workoutMinutes: Math.max(0, Number(row?.workoutMinutes ?? 0) || 0),
        workoutsCompleted: Math.max(0, Number(row?.workoutsCompleted ?? 0) || 0),
        dailyTargetCalories: Math.max(
          0,
          Number(row?.dailyTargetCalories ?? DEFAULT_CALORIES_TARGET) || DEFAULT_CALORIES_TARGET
        ),
        timestamp: row?.timestamp,
      };
    });
  }

  async getMonthlyProgress(uid: string, monthDate: Date): Promise<ProgressDoc[]> {
    const monthPrefix = localDateIdFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)).slice(0, 7);
    const rows = await this.getAllProgress(uid);
    return rows.filter((row) => String(row?.dateId ?? "").startsWith(monthPrefix));
  }
  listenToDaily(uid: string, dateId: string, callback: (data:any)=>void) {
  return onSnapshot(
    this.dailyDocRef(uid, dateId),
    snap => {
      callback(snap.exists() ? snap.data() : null);
    }
  );
}
async getMonthlyDailyMetrics(uid: string, monthDate: Date) {
  const monthPrefix = localDateIdFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)).slice(0, 7);
  const col = collection(db, "users", uid, "daily");
  const snaps = await getDocs(col);
  const rows = snaps.docs
    .map((d) => d.data() as DailyMetricsDoc)
    .filter((d) => String(d?.dateId ?? "").startsWith(monthPrefix));
  return rows;
}
async calculateStreak(uid: string) {
  const col = collection(db, "users", uid, "daily");
  const snaps = await getDocs(col);

  const days = snaps.docs
    .map(d => d.data() as DailyMetricsDoc)
    .filter(d => Boolean(d?.dateId));

  const byDate = new Map<string, boolean>();
  days.forEach((d) => {
    byDate.set(String(d.dateId), evaluateDailyStreak(d));
  });

  // Current streak: consecutive qualified days from today backward.
  let currentStreak = 0;
  const cursor = new Date();
  for (let i = 0; i < 366; i++) {
    const id = localDateIdFromDate(cursor);
    if (byDate.get(id) === true) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  // Longest streak across known history.
  const qualifiedIds = Array.from(byDate.entries())
    .filter(([, qualified]) => qualified)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));

  let longest = 0;
  let run = 0;
  let prevDate: Date | null = null;
  for (const id of qualifiedIds) {
    const d = new Date(id);
    if (!prevDate) {
      run = 1;
      longest = Math.max(longest, run);
      prevDate = d;
      continue;
    }
    const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevDate = d;
  }

  return { streak: currentStreak, longest };
}
}

export default DailyMetricsService;
