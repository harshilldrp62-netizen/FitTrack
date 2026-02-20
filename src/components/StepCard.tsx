import React, { useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepHistoryModal from "@/components/StepHistoryModal";
import StepHistoryService from "@/services/StepHistoryService";
import { auth } from "@/firebase";
import { localDateId } from "@/services/DailyMetricsService";
import { getNativeSteps } from "@/plugins/steps";

const DAILY_TARGET = 10000;
const STEP_LATEST_KEY = "steps_latest";
const historyService = new StepHistoryService();

const StepCard: React.FC = () => {
  const [stepCount, setStepCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const lastSavedFirebaseStepsRef = useRef<number>(-1);

  const getTodayKey = () => new Date().toDateString();

  const toSafeNumber = (value: unknown): number => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
  };
  const readWeekStore = (): Record<string, number> => {
    try {
      const parsed = JSON.parse(localStorage.getItem("steps_week") || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const persistSteps = (value: number) => {
    const safe = toSafeNumber(value);
    localStorage.setItem(STEP_LATEST_KEY, safe.toString());
    localStorage.setItem(`steps_total_${getTodayKey()}`, safe.toString());

    // weekly cache
    const iso = new Date().toISOString().slice(0, 10);
    const week = readWeekStore();
    week[iso] = safe;
    localStorage.setItem("steps_week", JSON.stringify(week));

    return safe;
  };

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    const load = async () => {
      const todayKey = getTodayKey();
      const saved = toSafeNumber(localStorage.getItem(`steps_total_${todayKey}`));

      // Native plugin returns today's steps (already baseline-adjusted by Android service).
      const native = await getNativeSteps().catch(() => 0);
      const safeNative = toSafeNumber(native);
      const best = Math.max(saved, safeNative);

      const safe = persistSteps(best);
      setStepCount(safe);

      // Save once on initial load too (important when auth initializes after app boot).
      const uid = auth.currentUser?.uid;
      if (uid && safe !== lastSavedFirebaseStepsRef.current) {
        lastSavedFirebaseStepsRef.current = safe;
        const dateId = localDateId().toString();
        historyService.saveSteps(uid, dateId, safe).catch(() => {});
      }

      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- LIVE UPDATES ---------------- */
  useEffect(() => {
    const handler = (event: Event) => {
      const safe = persistSteps(toSafeNumber((event as CustomEvent).detail));
      setStepCount(safe);

      const uid = auth.currentUser?.uid;
      if (uid && safe !== lastSavedFirebaseStepsRef.current) {
        lastSavedFirebaseStepsRef.current = safe;
        const dateId = localDateId().toString();
        // Single merge write into users/{uid}/steps/{YYYY-MM-DD} to avoid duplicates.
        historyService.saveSteps(uid, dateId, safe).catch(() => {});
      }
    };

    window.addEventListener("stepUpdate", handler);
    return () => window.removeEventListener("stepUpdate", handler);
  }, []);

  /* ---------------- SAFE PROGRESS ---------------- */
  const safeSteps = Number.isFinite(Number(stepCount))
    ? toSafeNumber(stepCount)
    : 0;

  const progressValue = Number.isFinite((safeSteps / DAILY_TARGET) * 100)
    ? Math.min((safeSteps / DAILY_TARGET) * 100, 100)
    : 0;
  const caloriesBurned = Number((safeSteps * 0.04).toFixed(2));

  const message =
    DAILY_TARGET <= 7000
      ? "Balanced goal for your routine"
      : "Keep pushing";

  return (
    <>
      <div onClick={() => setOpen(true)} className="mobile-card cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="card-label">Steps Today</p>
              <p className="card-number">
                {loading ? "--" : (!isNaN(safeSteps) ? safeSteps : 0)}
                <span className="text-muted-foreground text-xs font-normal">
                  {" "}
                  / {DAILY_TARGET}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="card-label">Progress</p>
            <p className="text-2xl font-bold text-primary">
              {loading ? "--" : `${Math.round(progressValue)}%`}
            </p>
          </div>
        </div>

        <Progress value={loading ? 0 : progressValue} className="h-3 bg-secondary" />

        <p className="text-sm text-muted-foreground mt-3">
          {message} - {caloriesBurned.toFixed(2)} kcal
        </p>
      </div>

      <StepHistoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default StepCard;
