import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Utensils, Trash2 } from "lucide-react";
import LogFoodModal from "@/components/LogFoodModal";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import DailyMetricsService from "@/services/DailyMetricsService";
import { localDateId } from "@/services/DailyMetricsService";
import { auth } from "@/firebase";


interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

interface Meal {
  items: FoodItem[];
  totalCalories: number;
}

const Nutrition = () => {
  const { toast } = useToast();
  const dailyMetrics = new DailyMetricsService();
  const [meals, setMeals] = useState<Record<string, Meal>>({
    Breakfast: { items: [], totalCalories: 0 },
    Lunch: { items: [], totalCalories: 0 },
    Dinner: { items: [], totalCalories: 0 },
    Snacks: { items: [], totalCalories: 0 },
  });
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("Snacks");
  const [userDietType, setUserDietType] = useState<string>("nonveg");
  const [dailyMacros, setDailyMacros] = useState({
    calories: null as number | null,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem("userProfile");
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        if (typeof parsed?.dietType === "string" && parsed.dietType.trim()) {
          setUserDietType(parsed.dietType);
        }
      }
    } catch {
      // Keep default if profile cache is unavailable/corrupt.
    }

    const today = new Date().toDateString();
    const savedMeals = localStorage.getItem(`meals_${today}`);
    if (savedMeals) {
      const parsedMeals = JSON.parse(savedMeals);
      setMeals(parsedMeals);

      // Calculate daily macros
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      Object.values(parsedMeals).forEach((meal: any) => {
        totalCalories += meal.totalCalories || 0;
        meal.items?.forEach((item: FoodItem) => {
          totalProtein += (item.protein || 0) * (item.quantity || 1);
          totalCarbs += (item.carbs || 0) * (item.quantity || 1);
          totalFat += (item.fat || 0) * (item.quantity || 1);
        });
      });

      setDailyMacros({
        calories: null,
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      });
    }
  }, []);

  useEffect(() => {
    const syncCaloriesFromFirestore = async () => {
      try {
        const progress = await dailyMetrics.getProgressMetrics(localDateId().toString());
        const firestoreCalories = Math.max(0, Number((progress as any)?.calorieIntake ?? 0) || 0);
        setDailyMacros((prev) => ({
          ...prev,
          calories: Math.round(firestoreCalories),
        }));
        console.debug("AppState", `Calories restored: ${Math.round(firestoreCalories)}`);
      } catch {
        // Keep existing UI state if progress read fails.
      }
    };

    void syncCaloriesFromFirestore();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const todayId = localDateId().toString();
    const unsubscribe = dailyMetrics.listenToProgress(uid, todayId, (data) => {
      if (!data) {
        setDailyMacros((prev) => ({
          ...prev,
          calories: 0,
        }));
        console.debug("AppState", "No progress doc found for nutrition. Using zero calories.");
        return;
      }
      const firestoreCalories = Math.max(0, Number(data?.calorieIntake ?? 0) || 0);
      setDailyMacros((prev) => ({
        ...prev,
        calories: Math.round(firestoreCalories),
      }));
      console.debug("AppState", `Calories restored: ${Math.round(firestoreCalories)}`);
    });

    return () => unsubscribe();
  }, []);

  const handleLogFood = (food: any, quantity: number) => {
    const today = new Date().toDateString();
    const dateId = localDateId().toString();
    const updatedMeals = { ...meals };

    if (!updatedMeals[selectedMealType]) {
      updatedMeals[selectedMealType] = { items: [], totalCalories: 0 };
    }

    const calories = Math.round(food.calories * quantity);
    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      quantity,
    };

    updatedMeals[selectedMealType].items.push(newItem);
    updatedMeals[selectedMealType].totalCalories += calories;
    const updatedDailyCaloriesTotal = Object.values(updatedMeals).reduce(
      (sum, meal) => sum + Math.max(0, Number(meal?.totalCalories ?? 0) || 0),
      0
    );

    setMeals(updatedMeals);
    localStorage.setItem(`meals_${today}`, JSON.stringify(updatedMeals));

    // Update daily macros
    setDailyMacros((prev) => ({
      calories: Math.max(0, Number(prev.calories ?? 0) + calories),
      protein: prev.protein + Math.round(food.protein * quantity),
      carbs: prev.carbs + Math.round(food.carbs * quantity),
      fat: prev.fat + Math.round(food.fat * quantity),
    }));

    toast({
      title: "Food logged!",
      description: `${food.name} added to ${selectedMealType}`,
    });
    console.debug("FoodLog", `Food calories: ${calories}`);
    console.debug("FoodLog", `Updated daily calories: ${updatedDailyCaloriesTotal}`);

    // Firestore sync (non-blocking): store today's authoritative totals once.
    const foodsForSync = Object.entries(updatedMeals).flatMap(([mealType, meal]) =>
      (meal.items ?? []).map((item) => ({
        id: item.id,
        mealType,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        quantity: item.quantity,
      }))
    );
    const totalsForSync = foodsForSync.reduce(
      (acc, item) => {
        const qty = Number(item.quantity ?? 1) || 1;
        acc.calories += Math.max(0, Math.round((item.calories || 0) * qty));
        acc.protein += Math.max(0, Math.round((item.protein || 0) * qty));
        acc.carbs += Math.max(0, Math.round((item.carbs || 0) * qty));
        acc.fat += Math.max(0, Math.round((item.fat || 0) * qty));
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    console.debug("CalorieDebug", `Food log total: ${totalsForSync.calories}`);

    dailyMetrics.setFoodsLoggedAndTotals(foodsForSync as any, totalsForSync, dateId).catch(() => {});
  };

  const handleRemoveFood = async (mealType: string, itemId: string) => {
    const todayKey = new Date().toDateString();
    const updatedMeals: Record<string, Meal> = { ...meals };
    const meal = updatedMeals[mealType];
    if (!meal) return;

    const item = meal.items.find((i) => i.id === itemId);
    if (!item) return;

    // Update local state + localStorage immediately (instant UI)
    const removedCalories = Math.round(item.calories * item.quantity);
    const removedProtein = Math.round(item.protein * item.quantity);
    const removedCarbs = Math.round(item.carbs * item.quantity);
    const removedFat = Math.round(item.fat * item.quantity);

    updatedMeals[mealType] = {
      ...meal,
      items: meal.items.filter((i) => i.id !== itemId),
      totalCalories: Math.max(0, (meal.totalCalories || 0) - removedCalories),
    };

    setMeals(updatedMeals);
    localStorage.setItem(`meals_${todayKey}`, JSON.stringify(updatedMeals));

    setDailyMacros((prev) => ({
      calories: Math.max(0, Number(prev.calories ?? 0) - removedCalories),
      protein: Math.max(0, prev.protein - removedProtein),
      carbs: Math.max(0, prev.carbs - removedCarbs),
      fat: Math.max(0, prev.fat - removedFat),
    }));

    // Firestore: rebuild today's foodsLogged + nutritionTotals (best-effort)
    try {
      const dateId = localDateId().toString();
      const data = await dailyMetrics.getDailyMetrics(dateId);
      const foods = Array.isArray((data as any)?.foodsLogged) ? ((data as any).foodsLogged as any[]) : [];
      const filtered = foods.filter((f) => f?.id !== itemId);

      const totals = filtered.reduce(
        (acc, f) => {
          const qty = typeof f?.quantity === "number" ? f.quantity : 1;
          acc.calories += Math.round((f?.calories || 0) * qty);
          acc.protein += Math.round((f?.protein || 0) * qty);
          acc.carbs += Math.round((f?.carbs || 0) * qty);
          acc.fat += Math.round((f?.fat || 0) * qty);
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      await dailyMetrics.setFoodsLoggedAndTotals(filtered as any, totals, dateId);
    } catch {
      // ignore (offline / permissions)
    }

    toast({
      title: "Removed",
      description: `${item.name} removed from ${mealType}`,
    });
  };

  const toggleMeal = (mealType: string) => {
    setExpandedMeal(expandedMeal === mealType ? null : mealType);
  };

  const openFoodModal = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowFoodModal(true);
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">
              Nutrition
            </h1>
            <p className="text-sm text-muted-foreground">Track your meals</p>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="mobile-card">
          <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Calories</p>
              <p className="card-number">{dailyMacros.calories === null ? "--" : dailyMacros.calories}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Protein</p>
              <p className="card-number">{dailyMacros.protein}g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Carbs</p>
              <p className="card-number">{dailyMacros.carbs}g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Fat</p>
              <p className="card-number">{dailyMacros.fat}g</p>
            </div>
          </div>
        </div>
      </header>

      {/* Meal Sections */}
      <main className="space-y-3">
        {Object.entries(meals).map(([mealType, meal]) => (
          <div
            key={mealType}
            className="bg-card rounded-xl border border-border/50  "
          >
            <button
              onClick={() => toggleMeal(mealType)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{mealType}</p>
                  <p className="text-sm text-muted-foreground">
                    {meal.items.length} items • {meal.totalCalories} cal
                  </p>
                </div>
              </div>
              {expandedMeal === mealType ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedMeal === mealType && (
              <div className="px-4 pb-4 border-t border-border/50">
                {meal.items.length > 0 ? (
                  <div className="space-y-2 pt-3">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} serving{item.quantity !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-accent">
                            {Math.round(item.calories * item.quantity)} cal
                          </p>
                          <button
                            onClick={() => handleRemoveFood(mealType, item.id)}
                            className="w-8 h-8 rounded-md bg-background/60 hover:bg-background flex items-center justify-center"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-3 text-center">
                    No items logged yet
                  </p>
                )}
                <button
                  onClick={() => openFoodModal(mealType)}
                  className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Food
                </button>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => openFoodModal("Snacks")}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Log Food Modal */}
      <LogFoodModal
        isOpen={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        mealType={selectedMealType}
        onLogFood={handleLogFood}
        userDietType={userDietType}
      />
    </div>
  );
};

export default Nutrition;
