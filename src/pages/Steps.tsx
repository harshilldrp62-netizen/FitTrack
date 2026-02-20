import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Square, Bluetooth, Heart, Moon } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import StepCard from "@/components/StepCard";

const STEPS_GOAL = 10000;

const Steps = () => {
  const [steps, setSteps] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
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

    // Check if tracking was active
    const trackingState = localStorage.getItem("stepTrackingActive");
    setIsTracking(trackingState === "true");

    // Load wearable data
    const device = localStorage.getItem("connectedWearable");
    if (device) {
      setConnectedDevice(device);
      const savedHeartRate = localStorage.getItem("wearableHeartRate");
      const savedSleep = localStorage.getItem("wearableSleepHours");
      if (savedHeartRate) setHeartRate(toSafeNumber(savedHeartRate));
      if (savedSleep) setSleepHours(Number(savedSleep) || 0);
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

  const toggleTracking = () => {
    const newState = !isTracking;
    setIsTracking(newState);
    localStorage.setItem("stepTrackingActive", newState.toString());
  };

  const pairDevice = async () => {
    // Web Bluetooth API (requires HTTPS or localhost)
    try {
      if ("bluetooth" in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ["heart_rate"] }],
        });
        setConnectedDevice(device.name || "Wearable Device");
        localStorage.setItem("connectedWearable", device.name || "Wearable Device");
        
        // Simulate syncing data
        const nextHeartRate = Math.floor(Math.random() * 40) + 60; // 60-100 bpm
        const nextSleepHours = Math.floor(Math.random() * 3) + 6; // 6-9 hours
        setHeartRate(nextHeartRate);
        setSleepHours(nextSleepHours);
        localStorage.setItem("wearableHeartRate", String(nextHeartRate));
        localStorage.setItem("wearableSleepHours", String(nextSleepHours));
      } else {
        alert("Bluetooth not supported in this browser. Use HTTPS or localhost.");
      }
    } catch (error) {
      console.error("Bluetooth pairing failed:", error);
    }
  };

  const safeSteps = Number(steps) || 0;
  const progressValue = Number.isFinite((safeSteps / STEPS_GOAL) * 100)
    ? Math.min((safeSteps / STEPS_GOAL) * 100, 100)
    : 0;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  const distanceKm = (safeSteps * 0.0008).toFixed(2); // Approximate: 1 step ~= 0.8m
  const caloriesBurned = Number((safeSteps * 0.04).toFixed(2));
  const activeMinutes = Math.round(safeSteps / 100); // Rough estimate

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
        {/* Circular Progress */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-64 h-64">
            <svg className="transform -rotate-90 w-64 h-64">
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="90"
                stroke="hsl(var(--secondary))"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="90"
                stroke="hsl(var(--primary))"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-bold text-foreground">
                {!isNaN(safeSteps) ? safeSteps.toLocaleString() : 0}
              </p>
              <p className="text-base text-muted-foreground">steps</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progressValue)}% of {STEPS_GOAL.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Start/Stop Button */}
          <button
            onClick={toggleTracking}
            className={`mt-6 px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors ${
              isTracking
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isTracking ? (
              <>
                <Square className="w-5 h-5" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Tracking
              </>
            )}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
          <div className="mobile-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Distance</p>
            <p className="card-number">{distanceKm} km</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Calories</p>
            <p className="card-number">{caloriesBurned.toFixed(2)}</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="card-number">{activeMinutes} min</p>
          </div>
        </div>

        {/* Wearable Section */}
        <div className="bg-card rounded-2xl p-4 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Wearable Device</h2>
            {!connectedDevice && (
              <button
                onClick={pairDevice}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Bluetooth className="w-4 h-4" />
                Pair Device
              </button>
            )}
          </div>

          {connectedDevice ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bluetooth className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{connectedDevice}</p>
                  <p className="text-base text-muted-foreground">Connected</p>
                </div>
              </div>

              {heartRate !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Heart className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-base text-muted-foreground">Heart Rate</p>
                    <p className="font-semibold">{heartRate} bpm</p>
                  </div>
                </div>
              )}

              {sleepHours !== null && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Moon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-base text-muted-foreground">Sleep</p>
                    <p className="font-semibold">{sleepHours} hours</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base text-muted-foreground text-center py-4">
              Connect a wearable device to sync heart rate and sleep data
            </p>
          )}
        </div>

        {/* Step History Card */}
        <StepCard />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Steps;
