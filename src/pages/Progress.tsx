import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/firebase";
import DailyMetricsService, { localDateId } from "@/services/DailyMetricsService";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";

const Progress = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ calories: 0, workouts: 0, streak: 0 });
  const [timeRange, setTimeRange] = useState<"week" | "month" | "3months">("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [streakInfo, setStreakInfo] = useState({ streak: 0, longest: 0 });

  const dailyMetrics = new DailyMetricsService();

  const loadWeeklyData = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      const result:any[] = [];

     const base = new Date(); // freeze today once

for (let i = 6; i >= 0; i--) {
  const d = new Date(base);
  d.setDate(base.getDate() - i);

  // use LOCAL date helper
  const dateId = localDateIdFromDate(d);

  const data = await dailyMetrics.getDailyMetrics(dateId, uid);

  result.push({
    day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][6 - i],
    calories:
      data?.nutritionTotals?.calories ||
      data?.caloriesBurned ||
      0,
    workout: (data?.workoutMinutes || 0) > 0
  });
}



      setWeeklyData(result);
    } catch (e) {
      console.error(e);
    }
  };
const loadStreak = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const data = await dailyMetrics.calculateStreak(uid);
  setStreakInfo(data);
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dateId = localDateIdFromDate(date);

    const data = await dailyMetrics.getDailyMetrics(dateId, uid);

    const active =
      (data?.steps || 0) > 0 ||
      (data?.nutritionTotals?.calories || 0) > 0 ||
      (data?.workoutMinutes || 0) > 0 ||
      (data?.waterGlasses || 0) > 0;

    if (active) streak++;
    else break;
  }

  setMonthlyStats(prev => ({
    ...prev,
    streak
  }));
};

  useEffect(() => {
  const checkUserAndLoad = async () => {
    // wait briefly for Firebase to initialize
    setTimeout(async () => {
      const uid = auth.currentUser?.uid;
      console.log("UID in Progress:", uid);

      if (uid) {
        await loadWeeklyData();
        await loadStreak();
      } else {
        console.log("User not ready yet");
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
});

return () => unsubscribe();

}, []);

  

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

  const hasActivity = (day: number) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const savedMeals = localStorage.getItem(`meals_${date.toDateString()}`);
    const savedWorkouts = localStorage.getItem(`completedWorkouts_${date.toDateString()}`);
    return (savedMeals || savedWorkouts) ? true : Math.random() > 0.6;
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

      {/* Time Range Tabs */}
      <div className="relative z-10 mb-4">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "month" | "3months")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="3months">3 Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Overview */}
      <div className="relative z-10 mb-6 animate-slide-up">
        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
            <Flame className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="card-number">{monthlyStats.calories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Calories (30d)</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
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

    const data = await dailyMetrics.getDailyMetrics(dateId, uid);

    setSelectedDate(dateId);
    setSelectedData(data || {});
  }}
  className={`cursor-pointer aspect-square flex items-center justify-center rounded-lg text-sm relative ${
    day ? (isToday(day) ? "bg-primary text-primary-foreground" : "hover:bg-secondary") : ""
  }`}
>
  {day}
                {day && hasActivity(day) && !isToday(day) && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Activity logged</span>
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
