import { db } from "../firebase";
import { localDateId } from "@/services/DailyMetricsService";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { DailyStep, DailyStepDoc, Schedule, UserProfile } from "../types/step";
import { getInitialTarget, calculateNewTarget } from "../utils/stepLogic";
import DailyMetricsService from "./DailyMetricsService";

/**
 * StepService handles Firestore operations for steps and user target management.
 * If `userId` is omitted in methods the service falls back to localStorage (safe for development).
 */
export class StepService {
  constructor(private readonly _db = db) {}

  private readonly dailyMetrics = new DailyMetricsService();

  private userDocRef(userId: string) {
    return doc(this._db, "users", userId);
  }

  private stepsCollectionRef(userId: string) {
    return collection(this._db, "users", userId, "steps");
  }

  // Migration-safe ensure user profile exists and has schedule & weeklyTarget
  async ensureUserProfile(userId?: string, scheduleFromSignup?: Schedule): Promise<UserProfile> {
    if (!userId) {
      const schedule = scheduleFromSignup ?? "regular";
      return { schedule, weeklyTarget: getInitialTarget(schedule) };
    }

    const ref = this.userDocRef(userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as Partial<UserProfile>;
      const schedule = (data.schedule as Schedule) ?? scheduleFromSignup ?? "regular";
      const weeklyTarget = typeof data.weeklyTarget === "number" ? data.weeklyTarget : getInitialTarget(schedule);

      const patch: Partial<UserProfile> = {
        schedule,
        weeklyTarget,
      };

      if (!data.createdAt) patch.createdAt = serverTimestamp() as any;
      if (!data.lastTargetUpdate) patch.lastTargetUpdate = serverTimestamp() as any;

      await setDoc(ref, patch as any, { merge: true });

      return { schedule, weeklyTarget, lastTargetUpdate: data.lastTargetUpdate ?? null, createdAt: data.createdAt ?? null };
    }

    // create new user doc
    const schedule = scheduleFromSignup ?? "regular";
    const weeklyTarget = getInitialTarget(schedule);
    const payload: Partial<UserProfile> = {
      schedule,
      weeklyTarget,
      createdAt: serverTimestamp() as any,
      lastTargetUpdate: serverTimestamp() as any,
    };

    await setDoc(ref, payload as any, { merge: true });
    return { schedule, weeklyTarget, lastTargetUpdate: payload.lastTargetUpdate ?? null, createdAt: payload.createdAt ?? null };
  }

  // Fetch a single day's step document (YYYY-MM-DD)
  async fetchDay(userId: string | undefined, dateId: string): Promise<DailyStepDoc | null> {
    if (!userId) {
      const key = `steps_${dateId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DailyStep;
      return { id: dateId, ...parsed };
    }

    const ref = doc(this._db, "users", userId, "steps", dateId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as DailyStep) };
  }

  // Save today's steps (migration-safe, merge: true used)
  async saveDay(userId: string | undefined, dateId: string, steps: number): Promise<void> {
    if (!userId) {
      const key = `steps_${dateId}`;
      // minimal payload for localStorage
      const profile = localStorage.getItem("userProfile");
      const schedule = profile ? (JSON.parse(profile).hasHecticSchedule ? "hectic" : "regular") : "regular";
      const target = getInitialTarget(schedule as Schedule);
      const payload: DailyStep = { steps, target, completed: steps >= target, timestamp: null };
      localStorage.setItem(key, JSON.stringify(payload));
      return;
    }

    // Ensure user profile exists
    const profile = await this.ensureUserProfile(userId);
    const target = profile.weeklyTarget;

    const ref = doc(this._db, "users", userId, "steps", dateId);
    const payload: Partial<DailyStep> = {
      steps,
      target,
      completed: steps >= target,
      timestamp: serverTimestamp() as any,
    };

    await setDoc(ref, payload as any, { merge: true });

    // Also mirror into users/{uid}/daily/{dateId} for consolidated weekly reporting.
    // Best-effort and non-blocking; does not affect the existing steps collection.
    this.dailyMetrics.setSteps(steps, Math.round(steps * 0.04), dateId, userId).catch(() => {});
  }

  // Fetch last 7 days (by document id descending). If running against Firestore, order by timestamp desc.
  async fetchLast7Days(userId?: string): Promise<DailyStepDoc[]> {
    if (!userId) {
      // gather last 7 from localStorage by date keys
      const result: DailyStepDoc[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const id = d.toISOString().slice(0, 10);
        const raw = localStorage.getItem(`steps_${id}`);
        if (raw) {
          const parsed = JSON.parse(raw) as DailyStep;
          result.push({ id, ...parsed });
        } else {
          // push empty day with target from userProfile if available
          const profile = localStorage.getItem("userProfile");
          const schedule = profile ? (JSON.parse(profile).hasHecticSchedule ? "hectic" : "regular") : "regular";
          result.push({ id, steps: 0, target: getInitialTarget(schedule as Schedule), completed: false });
        }
      }
      return result;
    }

    const stepsCol = collection(this._db, "users", userId, "steps");
    const q = query(stepsCol, orderBy("timestamp", "desc"), limit(7));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as DailyStep) }));
  }

  // Evaluate last 7 days and update user's weeklyTarget if rules require change
  async evaluateAndUpdateWeeklyTarget(userId?: string): Promise<{ updated: boolean; previous: number; current: number } | null> {
    if (!userId) return null;

    const userRef = this.userDocRef(userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const data = snap.data() as Partial<UserProfile> & { schedule?: Schedule };
    const schedule = (data.schedule as Schedule) ?? "regular";
    const currentTarget = typeof data.weeklyTarget === "number" ? data.weeklyTarget : getInitialTarget(schedule);

    const last7 = await this.fetchLast7Days(userId);
    const completedDays = last7.filter((d) => d.completed).length;
    const newTarget = calculateNewTarget(currentTarget, completedDays, schedule);

    if (newTarget !== currentTarget) {
      await updateDoc(userRef, { weeklyTarget: newTarget, lastTargetUpdate: serverTimestamp() });
      return { updated: true, previous: currentTarget, current: newTarget };
    }

    return { updated: false, previous: currentTarget, current: currentTarget };
  }
}

export default StepService;
