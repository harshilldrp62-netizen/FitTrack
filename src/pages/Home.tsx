import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { localDateId } from "@/services/DailyMetricsService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";


import {
  User,
  Utensils,
  Flame,
  Droplets,
  Plus,
  Award,
  Target,
  Bell,
  Footprints,
  Dumbbell,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogFoodModal from "@/components/LogFoodModal";
import StepCard from "@/components/StepCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import DailyMetricsService from "@/services/DailyMetricsService";

interface UserProfile {
  name: string;
  weight: string;
  height: string;
  age: string;
  weeklyHours: string;
  goal: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [steps, setSteps] = useState<number>(() => {
  const saved = localStorage.getItem("steps_latest");
  return saved ? Math.floor(Number(saved)) : 0;
});
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(0);

  const waterGoal = 8;
  const dailyMetrics = new DailyMetricsService();
  const toSafeNumber = (value: unknown): number => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
  };
  useEffect(() => {
  const interval = setInterval(() => {
    const latest = localStorage.getItem("steps_latest");
    const safe = Number.isFinite(Number(latest))
      ? Math.floor(Number(latest))
      : 0;

    setSteps(prev => (prev !== safe ? safe : prev));
  }, 2000);

  return () => clearInterval(interval);
}, []);

  /* -------------------- LOAD USER + DAILY DATA -------------------- */
  useEffect(() => {
    const loadProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    navigate("/onboarding");
    return;
  }

  const data = snap.data();

  if (!data.profileCompleted) {
    navigate("/onboarding");
    return;
  }

  setProfile({
    name: data.name,
    weight: data.weight?.toString() || "",
    height: data.height?.toString() || "",
    age: data.age?.toString() || "",
    weeklyHours: data.weeklyHours?.toString() || "",
    goal: data.goal || "",
  });
};

loadProfile();

    

    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("water_last_date");

if (lastDate !== today) {
  localStorage.setItem("water_last_date", today);
  localStorage.removeItem(`water_${lastDate}`);
}

    // Water: Firebase-first (daily metrics), localStorage fallback
    (async () => {
      try {
        const dateId = localDateId().toString();
        const data = await dailyMetrics.getDailyMetrics(dateId);
        const firebaseWater = toSafeNumber((data as any)?.waterGlasses);
        if (firebaseWater >= 0) {
          setWaterIntake(firebaseWater);
          localStorage.setItem(`water_${today}`, firebaseWater.toString());
        }
        const firebaseWorkout = toSafeNumber((data as any)?.workoutMinutes);
        setWorkoutMinutes(Math.floor(firebaseWorkout));
 
      } catch {
        // ignore and fall back to localStorage
      }

      const savedWater = localStorage.getItem(`water_${today}`);
      if (savedWater) setWaterIntake(Math.floor(toSafeNumber(savedWater)));
    })();

    // Load today's calories from meals
    const savedMeals = localStorage.getItem(`meals_${today}`);
    if (savedMeals) {
      const meals = JSON.parse(savedMeals);
      const totalCalories = Object.values(meals).reduce(
        (sum: number, meal: any) => sum + toSafeNumber(meal?.totalCalories),
        0
      ) as number;
      setTodayCalories(Math.floor(toSafeNumber(totalCalories)));
    }

    // Load workout minutes
    
  }, [navigate]);
useEffect(() => {
  const reloadDailyData = async () => {
    try {
      const dateId = localDateId().toString();
      const data = await dailyMetrics.getDailyMetrics(dateId);

      setWorkoutMinutes(Math.floor(toSafeNumber((data as any)?.workoutMinutes)));
      setWaterIntake(Math.floor(toSafeNumber((data as any)?.waterGlasses)));

    } catch (e) {
      console.error(e);
    }
  };

  window.addEventListener("focus", reloadDailyData);
  return () => window.removeEventListener("focus", reloadDailyData);
}, []);

  




    

  /* -------------------- CALCULATE CALORIE GOAL -------------------- */
  const calculateCalorieGoal = () => {
    if (!profile) return 2000;

    const weight = parseFloat(profile.weight) || 70;
    const height = parseFloat(profile.height) || 170;
    const age = parseFloat(profile.age) || 25;

    let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    let tdee = bmr * 1.4;

    if (profile.goal === "lose") tdee -= 500;
    if (profile.goal === "build") tdee += 300;

    return Math.round(tdee);
  };

  const caloriesGoal = calculateCalorieGoal();

  /* -------------------- WATER -------------------- */
  const addWater = () => {
    const today = new Date().toDateString();
    const newIntake = Math.floor(toSafeNumber(waterIntake + 1));
    setWaterIntake(newIntake);
    localStorage.setItem(`water_${today}`, newIntake.toString());

    // Firestore sync (non-blocking)
    dailyMetrics.setWaterGlasses(newIntake).catch(() => {});

    if (newIntake === waterGoal) {
      toast({
        title: "🎉 Water goal reached!",
        description: "Great hydration today!",
      });
    }
  };

  const removeWater = () => {
    const today = new Date().toDateString();
    const newIntake = Math.floor(Math.max(0, toSafeNumber(waterIntake - 1)));
    setWaterIntake(newIntake);
    localStorage.setItem(`water_${today}`, newIntake.toString());

    // Firestore sync (non-blocking)
    dailyMetrics.setWaterGlasses(newIntake).catch(() => {});
  };

  /* -------------------- CALCULATE CALORIES BURNED FROM STEPS -------------------- */
  const safeSteps = Math.floor(toSafeNumber(steps));
  const caloriesBurned = Number((safeSteps * 0.04).toFixed(2));

  // Sync steps/calories burned to Firestore daily doc (best-effort)
  useEffect(() => {
    if (safeSteps < 0) return;
    dailyMetrics.setSteps(safeSteps, caloriesBurned).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSteps, caloriesBurned]);

  /* -------------------- GREETING -------------------- */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleLogFood = async (food: any, quantity: number) => {
  const today = new Date().toDateString();
  const savedMeals = localStorage.getItem(`meals_${today}`);
  const meals = savedMeals ? JSON.parse(savedMeals) : {};

  const mealType = "Snacks";

  if (!meals[mealType]) {
    meals[mealType] = { items: [], totalCalories: 0 };
  }

  const calories = Math.floor(toSafeNumber(food?.calories) * toSafeNumber(quantity));

  meals[mealType].items.push({
    ...food,
    quantity,
    calories,
  });

  meals[mealType].totalCalories = toSafeNumber(meals?.[mealType]?.totalCalories) + calories;

  localStorage.setItem(`meals_${today}`, JSON.stringify(meals));
  setTodayCalories(prev => Math.floor(toSafeNumber(prev) + calories));

  // 🔥 FIREBASE SAVE (FIXED)
  const uid = auth.currentUser?.uid;

  if (uid) {
    const dateId = localDateId().toString();

    await dailyMetrics.addLoggedFood(
      {
        id: Date.now().toString(),
        mealType,
        name: String(food?.name ?? "Food"),
        calories,
        protein: toSafeNumber(food?.protein),
        carbs: toSafeNumber(food?.carbs),
        fat: toSafeNumber(food?.fat),
        quantity: toSafeNumber(quantity)
      },
      {
        calories,
        protein: toSafeNumber(food?.protein),
        carbs: toSafeNumber(food?.carbs),
        fat: toSafeNumber(food?.fat)
      },
      dateId,
      uid
    );
  }

  toast({
    title: "Food logged!",
    description: `${String(food?.name ?? "Food")} added to ${mealType}`,
  });
};


  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-base">{getGreeting()},</p>
          <h1 className="mobile-title">
            {profile?.name || "User"}!
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/reminders">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
          </Link>
          <Link to="/profile">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User className="text-white w-6 h-6" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="space-y-6">
        {/* Daily Summary Cards */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <p className="card-number">{Math.floor(toSafeNumber(todayCalories))}</p>
            <p className="text-xs text-muted-foreground">/ {caloriesGoal}</p>
          </div>
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-1">
              <Footprints className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Steps</p>
            </div>
            <p className="card-number">{(!isNaN(safeSteps) ? safeSteps : 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Calories Burned</p>
            </div>
            <p className="card-number">{caloriesBurned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">From steps</p>
          </div>
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Water</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="card-number">{Math.floor(toSafeNumber(waterIntake))}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={removeWater}
                  aria-label="Remove a glass of water"
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addWater}
                  aria-label="Add a glass of water"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">/ {waterGoal} glasses</p>
          </div>
          <div className="mobile-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Workout</p>
            </div>
            <p className="card-number">{Math.floor(toSafeNumber(workoutMinutes))}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>
        </div>

        {/* Step Counter Card - subscribed to stepUpdate events */}
        <StepCard />

        {/* Quick Actions Grid */}
        <div>
          <h2 className="mobile-title mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <button
              onClick={() => setShowFoodModal(true)}
              className="bg-card rounded-xl p-4 border hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <Utensils className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Log Food</p>
              <p className="text-sm text-muted-foreground">Track your meals</p>
            </button>
            <Link
              to="/workouts"
              className="bg-card rounded-xl p-4 border hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
                <Dumbbell className="w-6 h-6 text-accent" />
              </div>
              <p className="font-semibold">Workouts</p>
              <p className="text-base text-muted-foreground">Start training</p>
            </Link>
            <Link
              to="/progress"
              className="bg-card rounded-xl p-4 border hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <p className="font-semibold">Progress</p>
              <p className="text-base text-muted-foreground">View analytics</p>
            </Link>
            <Link
              to="/steps"
              className="bg-card rounded-xl p-4 border hover:border-primary/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <Footprints className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Steps</p>
              <p className="text-base text-muted-foreground">Track activity</p>
            </Link>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="bg-primary text-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <Award className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-80">Daily Goal</p>
              <p className="text-lg font-bold">
                {caloriesGoal} Calories Target
              </p>
            </div>
            <Target className="ml-auto opacity-50 w-8 h-8" />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Log Food Modal */}
      <LogFoodModal
        isOpen={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        mealType="Snacks"
        onLogFood={handleLogFood}
      />
    </div>
  );
};

export default Home;
