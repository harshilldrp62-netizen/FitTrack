import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepHistoryModal from "@/components/StepHistoryModal";
import StepService from "@/services/StepService";
import { auth } from "@/firebase";
import { localDateId } from "@/services/DailyMetricsService";

const DAILY_TARGET = 8000; // You can change this

const StepCard: React.FC = () => {
  const [stepsToday, setStepsToday] = useState(0);
  const [baseSteps, setBaseSteps] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toDateString();
    const savedBase = localStorage.getItem(`steps_base_${todayKey}`);
    const savedTotal = localStorage.getItem(`steps_total_${todayKey}`);

    if (savedBase) {
      setBaseSteps(parseInt(savedBase, 10));
    }

    if (savedTotal) {
      setStepsToday(parseInt(savedTotal, 10));
      setLoading(false);
    }

    const handler = (event: any) => {
      const totalSteps: number = event.detail ?? 0;
      const key = new Date().toDateString();
      const storedBase = localStorage.getItem(`steps_base_${key}`);
      let baseForToday = storedBase ? parseInt(storedBase, 10) : null;

      if (baseForToday == null || baseForToday <= 0) {
        baseForToday = totalSteps;
        localStorage.setItem(`steps_base_${key}`, baseForToday.toString());
        setBaseSteps(baseForToday);
      }

      const calculated = totalSteps - baseForToday;
      const todaySteps = calculated > 0 ? calculated : 0;
      setStepsToday(todaySteps);
      const service = new StepService();
const uid = auth.currentUser?.uid;
const dateId = localDateId().toString();

if (uid) {
  service.saveDay(uid, dateId, todaySteps).catch(() => {});
}
      localStorage.setItem(`steps_total_${key}`, todaySteps.toString());
      setLoading(false);
    };

    window.addEventListener("stepUpdate", handler);

    return () => {
      window.removeEventListener("stepUpdate", handler);
    };
  }, []);

  const progress = Math.min((stepsToday / DAILY_TARGET) * 100, 100);

  const message =
    DAILY_TARGET <= 7000
      ? "Balanced goal for your routine ⚡"
      : "Keep pushing 💪";

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
                {loading ? "--" : stepsToday}
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
              {loading ? "--" : `${Math.round(progress)}%`}
            </p>
          </div>
        </div>

        <Progress value={loading ? 0 : progress} className="h-3 bg-secondary" />
        <p className="text-sm text-muted-foreground mt-3">{message}</p>
      </div>

      <StepHistoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default StepCard;
