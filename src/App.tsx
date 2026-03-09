import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, authReady } from "@/firebase";
import { getNativeSteps } from "@/services/NativeStepService";
import PedometerService from "@/services/PedometerService";
import { Capacitor } from "@capacitor/core";
import { syncNativeReminders } from "@/services/NativeStepService";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Nutrition from "./pages/Nutrition";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Steps from "./pages/Steps";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const lastStepsRef = useRef(-1);
  const pedometerRef = useRef<PedometerService | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    void authReady.finally(() => {
      const existingUser = auth.currentUser;
      if (existingUser) {
        setUser(existingUser);
        setAuthLoading(false);
      }

      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const dispatchSafeSteps = (raw: unknown, source: "native" | "pedometer") => {
      const safeSteps =
        Number.isFinite(Number(raw)) && Number(raw) >= 0
          ? Math.floor(Number(raw))
          : 0;

      if (safeSteps !== lastStepsRef.current) {
        lastStepsRef.current = safeSteps;
        window.dispatchEvent(new CustomEvent("stepUpdate", { detail: safeSteps }));
      }

      return safeSteps;
    };

    pedometerRef.current = new PedometerService();
    pedometerRef.current.start((steps) => {
      dispatchSafeSteps(steps, "pedometer");
    }).catch(() => {});

    const poll = async () => {
      try {
        // Native plugin returns today's steps (already baseline-adjusted on Android service side).
        console.log("[App] polling...");
        const stepsRaw = await getNativeSteps();
        console.log("[App] raw steps:", stepsRaw);
        const safeSteps = dispatchSafeSteps(stepsRaw, "native");
        console.log("[App] safe steps:", safeSteps);
      } catch (e) {
        console.error("Step polling error:", e);
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      clearInterval(id);
      pedometerRef.current?.stop().catch(() => {});
      pedometerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const syncReminderSchedulesAtStartup = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const enabledRaw = localStorage.getItem("notificationsEnabled");
        const notificationsEnabled = enabledRaw === null ? true : enabledRaw === "true";
        type Reminder = { id: string; enabled: boolean; time: string };
        const rawReminders = localStorage.getItem("reminders");
        const reminders: Reminder[] = rawReminders ? JSON.parse(rawReminders) : [];

        const rawWorkout = localStorage.getItem("customWorkoutReminder");
        const workout = rawWorkout ? JSON.parse(rawWorkout) : null;
        await syncNativeReminders(
          notificationsEnabled,
          reminders,
          workout?.enabled && typeof workout.time === "string"
            ? { enabled: true, time: workout.time }
            : { enabled: false, time: "18:00" }
        );
      } catch (err) {
        console.warn("Startup reminder sync failed:", err);
      }
    };

    syncReminderSchedulesAtStartup();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-background overflow-y-auto">
          <div className="w-full max-w-md mx-auto px-4 pb-28 min-h-screen overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
              <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignUp />} />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nutrition"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Nutrition />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workouts"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Workouts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/steps"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Steps />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Reminders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute user={user} authLoading={authLoading}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
