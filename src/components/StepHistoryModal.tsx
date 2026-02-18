import React, { useMemo } from "react";
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

const DAILY_TARGET = 8000;

interface Props {
  open: boolean;
  onClose: () => void;
}

const StepHistoryModal: React.FC<Props> = ({ open, onClose }) => {

  // Generate last 7 days data
  const { data, streak } = useMemo(() => {
    const today = new Date();
    const days = [];
    let streakCount = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const key = date.toDateString();

      const steps = parseInt(localStorage.getItem(`steps_total_${key}`) || "0");

      const completed = steps >= DAILY_TARGET;

      days.push({
        date: key.slice(4, 10), // shorter date
        steps,
        completed,
      });

      if (i === 0 && completed) {
        streakCount++;
      } else if (completed && streakCount === 7 - i - 1) {
        streakCount++;
      }
    }

    return { data: days, streak: streakCount };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle className="mobile-title">Weekly Steps</DialogTitle>
          <DialogDescription>
            Last 7 days — streak: {streak} day{streak !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <XAxis dataKey="date" />
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
