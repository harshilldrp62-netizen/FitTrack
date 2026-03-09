import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/firebase";
import DailyMetricsService from "@/services/DailyMetricsService";
import { localDateIdFromDate } from "@/services/DailyMetricsService";
import { 
  ArrowLeft, 
  TrendingUp,
  Flame,
  Dumbbell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import BottomNavigation from "@/components/BottomNavigation";

const Progress = () => {
  const DEFAULT_DAILY_TARGET_CALORIES = 2000;
  const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  type ProgressCache = {
    weeklyCalories?: Array<{ day: string; calories: number }>;
    monthlyStats?: { calories: number; workouts: number; streak: number };
    streakInfo?: { streak: number; longest: number };
    qualifiedDateIds?: string[];
  };
  const toSafeNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const getDailyTargetCalories = (daily: any): number =>
    Math.max(0, toSafeNumber(daily?.dailyTargetCalories ?? daily?.caloriesTarget ?? DEFAULT_DAILY_TARGET_CALORIES));
  const getIntakeCalories = (daily: any): number =>
    Math.max(0, toSafeNumber(daily?.calorieIntake ?? 0));
  const isStreakQualifiedByIntake = (daily: any): boolean => getIntakeCalories(daily) >= getDailyTargetCalories(daily);
  const parseDateId = (dateId: string): Date | null => {
    const [y, m, d] = dateId.split("-").map((v) => Number(v));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weeklyCalories, setWeeklyCalories] = useState<Array<{ day: string; calories: number }>>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({ calories: 0, workouts: 0, streak: 0 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [streakInfo, setStreakInfo] = useState({ streak: 0, longest: 0 });
  const [qualifiedDateIds, setQualifiedDateIds] = useState<Set<string>>(new Set());

  const dailyMetrics = new DailyMetricsService();
  const zeroCaloriesWeek = [
    { day: "Mon", calories: 0 },
    { day: "Tue", calories: 0 },
    { day: "Wed", calories: 0 },
    { day: "Thu", calories: 0 },
    { day: "Fri", calories: 0 },
    { day: "Sat", calories: 0 },
    { day: "Sun", calories: 0 },
  ];
  const cacheKey = (uid: string) => `progress_cache_${uid}`;
  const readCache = (uid: string): ProgressCache | null => {
    try {
      const raw = localStorage.getItem(cacheKey(uid));
      if (!raw) return null;
      return JSON.parse(raw) as ProgressCache;
    } catch {
      return null;
    }
  };
  const writeCache = (uid: string, patch: ProgressCache) => {
    const current = readCache(uid) ?? {};
    const next: ProgressCache = {
      ...current,
      ...patch,
      monthlyStats: {
        calories: patch.monthlyStats?.calories ?? current.monthlyStats?.calories ?? 0,
        workouts: patch.monthlyStats?.workouts ?? current.monthlyStats?.workouts ?? 0,
        streak: patch.monthlyStats?.streak ?? current.monthlyStats?.streak ?? 0,
      },
    };
    localStorage.setItem(cacheKey(uid), JSON.stringify(next));
  };
  const normalizeWeeklyCalories = (rows?: Array<{ day: string; calories: number }>) => {
    const caloriesByDay = new Array<number>(7).fill(0);
    (rows ?? []).forEach((row) => {
      const idx = WEEKDAY_LABELS.indexOf(String(row?.day ?? "").slice(0, 3));
      if (idx >= 0) {
        caloriesByDay[idx] = Math.max(0, Math.round(toSafeNumber(row?.calories)));
      }
    });
    return WEEKDAY_LABELS.map((day, idx) => ({ day, calories: caloriesByDay[idx] }));
  };

  const loadWeeklyData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setWeeklyLoading(true);
    try {
      const rows = await dailyMetrics.getRecentProgress(uid, 7);
      const caloriesByDay = new Array<number>(7).fill(0);
      rows.forEach((row) => {
        const date = parseDateId(String(row?.dateId ?? ""));
        if (!date) return;
        const dayIndex = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
        const intake = Math.max(0, Math.round(toSafeNumber(row.calorieIntake)));
        caloriesByDay[dayIndex] = intake;
        console.debug("CalorieDebug", `Firestore value (${row?.dateId}): ${intake}`);
      });
      const caloriesResult = WEEKDAY_LABELS.map((day, idx) => ({
        day,
        calories: caloriesByDay[idx],
      }));
      const weeklyCaloriesTotal = rows.reduce(
        (sum, row) => sum + Math.max(0, Math.round(toSafeNumber(row.calorieIntake))),
        0
      );
      console.debug("CalorieDebug", `Weekly Firestore total: ${Math.max(0, Math.round(weeklyCaloriesTotal))}`);
      const weeklyWorkoutCount = rows.reduce(
        (sum, row) => sum + Math.max(0, Math.round(toSafeNumber(row.workoutsCompleted))),
        0
      );
      const todayProgress = rows.find((row) => String(row?.dateId ?? "") === localDateIdFromDate(new Date()));
      console.debug("ProgressDebug", `Calories loaded: ${Math.max(0, Math.round(weeklyCaloriesTotal))}`);
      console.debug("ProgressDebug", `Workout minutes loaded: ${Math.max(0, Math.round(toSafeNumber(todayProgress?.workoutMinutes ?? 0)))}`);

      setWeeklyCalories(caloriesResult);
      setMonthlyStats((prev) => ({
        ...prev,
        calories: Math.max(0, Math.round(weeklyCaloriesTotal)),
        workouts: weeklyWorkoutCount,
      }));
      writeCache(uid, {
        weeklyCalories: caloriesResult,
        monthlyStats: {
          calories: Math.max(0, Math.round(weeklyCaloriesTotal)),
          workouts: weeklyWorkoutCount,
          streak: monthlyStats.streak,
        },
      });
    } catch (e) {
      console.error("ProgressFetch", "Failed to load progress data", e);
      const cached = readCache(uid);
      if (cached?.weeklyCalories) {
        setWeeklyCalories(normalizeWeeklyCalories(cached.weeklyCalories));
      } else {
        setWeeklyCalories(zeroCaloriesWeek);
      }
      if (cached?.monthlyStats) {
        setMonthlyStats((prev) => ({
          ...prev,
          calories: cached.monthlyStats?.calories ?? prev.calories,
          workouts: cached.monthlyStats?.workouts ?? prev.workouts,
        }));
      }
    } finally {
      setWeeklyLoading(false);
    }
  };
  const loadStreak = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const rows = await dailyMetrics.getAllProgress(uid);
      const byDate = new Map<string, boolean>();
      rows.forEach((row) => {
        const dateId = String(row?.dateId ?? "");
        if (!dateId) return;
        byDate.set(dateId, isStreakQualifiedByIntake(row));
      });

      let currentStreak = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      for (let i = 0; i < 366; i++) {
        const id = localDateIdFromDate(cursor);
        if (byDate.get(id) === true) {
          currentStreak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }

      const qualifiedIds = Array.from(byDate.entries())
        .filter(([, qualified]) => qualified)
        .map(([id]) => id)
        .sort((a, b) => a.localeCompare(b));

      let longest = 0;
      let run = 0;
      let prevDate: Date | null = null;
      for (const id of qualifiedIds) {
        const d = parseDateId(id);
        if (!d) continue;
        if (!prevDate) {
          run = 1;
          longest = Math.max(longest, run);
          prevDate = d;
          continue;
        }
        const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          run += 1;
        } else {
          run = 1;
        }
        longest = Math.max(longest, run);
        prevDate = d;
      }

      setStreakInfo({ streak: currentStreak, longest });
      setMonthlyStats((prev) => ({
        ...prev,
        streak: currentStreak
      }));
      writeCache(uid, {
        streakInfo: { streak: currentStreak, longest },
        monthlyStats: {
          calories: monthlyStats.calories,
          workouts: monthlyStats.workouts,
          streak: currentStreak,
        },
      });
    } catch (e) {
      console.error("ProgressFetch", "Failed to load progress data", e);
      const cached = readCache(uid);
      if (cached?.streakInfo) {
        setStreakInfo(cached.streakInfo);
      }
      if (cached?.monthlyStats) {
        setMonthlyStats((prev) => ({
          ...prev,
          streak: cached.monthlyStats?.streak ?? prev.streak,
        }));
      }
    }
  };
  const loadMonthlyCalendarData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setQualifiedDateIds(new Set());
      return;
    }
    try {
      const rows = await dailyMetrics.getMonthlyProgress(uid, currentMonth);
      const qualified = new Set(
        rows
          .filter((r) => isStreakQualifiedByIntake(r))
          .map((r) => String(r.dateId))
      );
      setQualifiedDateIds(qualified);
      writeCache(uid, { qualifiedDateIds: Array.from(qualified) });
    } catch (e) {
      console.error("ProgressFetch", "Failed to load progress data", e);
      const cached = readCache(uid);
      if (cached?.qualifiedDateIds) {
        setQualifiedDateIds(new Set(cached.qualifiedDateIds));
      }
    }
  };

  useEffect(() => {
  const checkUserAndLoad = async () => {
    // wait briefly for Firebase to initialize
    setTimeout(async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await loadWeeklyData();
        await loadStreak();
        await loadMonthlyCalendarData();
      } else {
        setWeeklyCalories(zeroCaloriesWeek);
        setStreakInfo({ streak: 0, longest: 0 });
        setMonthlyStats({ calories: 0, workouts: 0, streak: 0 });
        setQualifiedDateIds(new Set());
      }
    }, 800);
  };

  checkUserAndLoad();
  const uid = auth.currentUser?.uid;
if (!uid) return;

const todayId = localDateIdFromDate(new Date());

const unsubscribe = dailyMetrics.listenToDaily(uid, todayId, async () => {
  await loadWeeklyData();
  await loadStreak();
  await loadMonthlyCalendarData();
});

return () => unsubscribe();

}, []);
useEffect(() => {
  void loadMonthlyCalendarData();
}, [currentMonth]);

  

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const hasQualifiedStreak = (day: number) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateId = localDateIdFromDate(date);
    return qualifiedDateIds.has(dateId);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="mobile-page">
      {/* Background Effects */}
      <div className="    pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 mobile-header">
        <div className="flex items-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">Progress</h1>
            <p className="text-sm text-muted-foreground">Track your journey</p>
          </div>
        </div>
      </header>

      {/* Weekly Progress Header */}
      <div className="relative z-10 mb-4">
        <h2 className="mobile-title">Weekly Progress</h2>
      </div>

      {/* Stats Overview */}
      <div className="relative z-10 mb-6 animate-slide-up">
        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
            <Flame className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="card-number">{Math.max(0, Math.round(monthlyStats.calories))}</p>
            <p className="text-xs text-muted-foreground">Calories (7d)</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
            <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="card-number">{monthlyStats.workouts}</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
            <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="card-number">{streakInfo.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="relative z-10 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <h2 className="mobile-title mb-4">Weekly Calories</h2>
          <div className="h-48">
            {weeklyLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading weekly calories...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCalories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="relative z-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="mobile-title">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <div
  key={idx} 
 

  className="text-center text-xs text-muted-foreground py-2"
>

                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, idx) => (
              <div
  key={idx}
  onClick={async () => {
    if (!day) return;

    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    const dateId = localDateIdFromDate(date);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const [dailyData, progressData] = await Promise.all([
      dailyMetrics.getDailyMetrics(dateId, uid),
      dailyMetrics.getProgressMetrics(dateId, uid),
    ]);

    setSelectedDate(dateId);
    setSelectedData({
      ...(dailyData || {}),
      workoutMinutes: Math.max(0, Math.round(toSafeNumber((progressData as any)?.workoutMinutes ?? (dailyData as any)?.workoutMinutes ?? 0))),
      calorieIntake: Math.max(0, Math.round(toSafeNumber((progressData as any)?.calorieIntake ?? 0))),
    });
  }}
  className={`cursor-pointer aspect-square flex items-center justify-center rounded-lg text-sm relative ${
    day ? (isToday(day) ? "bg-primary text-primary-foreground" : "hover:bg-secondary") : ""
  }`}
>
  {day}
                {day && hasQualifiedStreak(day) && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Streak qualified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
          </div>
        </div>
      </div>
      {selectedDate && (
  <div className="  bg-black/50 flex items-center justify-center z-50">
    <div className="bg-card rounded-2xl p-4 w-[90%] max-w-md">
      <h2 className="text-lg font-bold mb-4">
        Stats for {selectedDate}
      </h2>

      <div className="space-y-2 text-sm">
        <p>👣 Steps: {selectedData?.steps || 0}</p>
        <p>🔥 Calories Burned: {selectedData?.caloriesBurned || 0}</p>
        <p>🍽 Calories Eaten: {selectedData?.nutritionTotals?.calories || 0}</p>
        <p>🏋️ Workout Minutes: {selectedData?.workoutMinutes || 0}</p>
        <p>💧 Water Glasses: {selectedData?.waterGlasses || 0}</p>

        <div className="pt-2 border-t border-border/50">
          <p>Protein: {selectedData?.nutritionTotals?.protein || 0}g</p>
          <p>Carbs: {selectedData?.nutritionTotals?.carbs || 0}g</p>
          <p>Fat: {selectedData?.nutritionTotals?.fat || 0}g</p>
        </div>
      </div>

      <button
        onClick={() => setSelectedDate(null)}
        className="mt-4 w-full bg-primary text-white py-2 rounded-lg"
      >
        Close
      </button>
    </div>
  </div>
)}


      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Progress;
