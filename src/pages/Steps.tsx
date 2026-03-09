import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import StepCard from "@/components/StepCard";
import StepHistoryChart from "@/components/StepHistoryChart";

const Steps = () => {
  const [steps, setSteps] = useState<number>(0);
  const toSafeNumber = (value: unknown): number => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
  };

  useEffect(() => {
    const today = new Date().toDateString();
    const savedTotal = localStorage.getItem(`steps_total_${today}`);
    if (savedTotal) {
      setSteps(toSafeNumber(savedTotal));
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const today = new Date().toDateString();
      const savedTotal = localStorage.getItem(`steps_total_${today}`);
      setSteps(toSafeNumber(savedTotal));
    };

    sync();
    const id = setInterval(sync, 2000);
    return () => clearInterval(id);
  }, []);

  const safeSteps = Number(steps) || 0;
  const distanceKm = (safeSteps * 0.0008).toFixed(2); // Approximate: 1 step ~= 0.8m
  const caloriesBurned = Number((safeSteps * 0.04).toFixed(2));

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">
              Step Counter
            </h1>
            <p className="text-sm text-muted-foreground">Track your activity</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="mobile-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Distance</p>
            <p className="card-number">{distanceKm} km</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Calories</p>
            <p className="card-number">{caloriesBurned.toFixed(2)}</p>
          </div>
        </div>

        {/* Step History Card */}
        <StepCard />

        {/* Weekly chart now shown only on Steps page */}
        <StepHistoryChart />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Steps;
