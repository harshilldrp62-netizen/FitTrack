import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { auth } from "@/firebase";
import StepHistoryService, { type WeeklyStepPoint } from "@/services/StepHistoryService";

const DAILY_TARGET = 10000;
const historyService = new StepHistoryService();

interface Props {
  open: boolean;
  onClose: () => void;
}

const StepHistoryModal: React.FC<Props> = ({ open, onClose }) => {
  const [data, setData] = useState<Array<WeeklyStepPoint & { completed: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  const toSafeNumber = (value: unknown): number => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
  };

  const loadLocalWeekly = () => {
    const today = new Date();
    const days: Array<WeeklyStepPoint & { completed: boolean }> = [];
    let weekStore: Record<string, number> = {};
    try {
      const parsed = JSON.parse(localStorage.getItem("steps_week") || "{}");
      weekStore = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      weekStore = {};
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const isoKey = date.toISOString().slice(0, 10);
      const localKey = `steps_total_${date.toDateString()}`;
      const raw = weekStore?.[isoKey] ?? localStorage.getItem(localKey) ?? 0;
      const safe = toSafeNumber(raw);

      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        steps: safe,
        completed: safe >= DAILY_TARGET,
      });
    }

    return days;
  };

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setData(loadLocalWeekly());
        setLoading(false);
        return;
      }

      try {
        const firebaseWeek = await historyService.getWeeklySteps(uid);
        setData(
          (firebaseWeek.length === 7 ? firebaseWeek : loadLocalWeekly()).map((day) => ({
            day: day.day,
            steps: toSafeNumber(day.steps),
            completed: toSafeNumber(day.steps) >= DAILY_TARGET,
          }))
        );
      } catch {
        setData(loadLocalWeekly());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  const streak = useMemo(() => {
    let count = 0;

    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].completed) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle className="mobile-title">Weekly Steps</DialogTitle>
          <DialogDescription>
            Last 7 days - streak: {streak} day{streak !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div style={{ width: "100%", height: 240 }}>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Loading weekly steps...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps">
                  {data.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.completed ? "#16a34a" : "#3b82f6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StepHistoryModal;
