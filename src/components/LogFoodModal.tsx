import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Search,
  Plus,
  Minus,
  Utensils,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";

type DietCategory = "veg" | "egg" | "nonveg" | "vegan";
type FoodCategory = "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "Beverages";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  dietCategory: DietCategory;
  category: FoodCategory;
}

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: string;
  onLogFood: (food: FoodItem, quantity: number) => void;
  userDietType?: string;
}

const commonFoods: FoodItem[] = [
  { id: "1", name: "Poha", calories: 250, protein: 5, carbs: 45, fat: 6, serving: "1 plate", dietCategory: "veg", category: "Breakfast" },
  { id: "2", name: "Upma", calories: 220, protein: 6, carbs: 36, fat: 6, serving: "1 bowl", dietCategory: "veg", category: "Breakfast" },
  { id: "3", name: "Idli", calories: 160, protein: 5, carbs: 32, fat: 1, serving: "2 idlis", dietCategory: "vegan", category: "Breakfast" },
  { id: "4", name: "Dosa", calories: 190, protein: 4, carbs: 34, fat: 4, serving: "1 dosa", dietCategory: "vegan", category: "Breakfast" },
  { id: "5", name: "Masala Dosa", calories: 320, protein: 7, carbs: 50, fat: 10, serving: "1 dosa", dietCategory: "veg", category: "Breakfast" },
  { id: "6", name: "Paratha", calories: 260, protein: 6, carbs: 35, fat: 10, serving: "1 piece", dietCategory: "veg", category: "Breakfast" },
  { id: "7", name: "Aloo Paratha", calories: 300, protein: 7, carbs: 42, fat: 11, serving: "1 piece", dietCategory: "veg", category: "Breakfast" },
  { id: "8", name: "Paneer Paratha", calories: 330, protein: 12, carbs: 36, fat: 15, serving: "1 piece", dietCategory: "veg", category: "Breakfast" },
  { id: "9", name: "Thepla", calories: 210, protein: 5, carbs: 30, fat: 8, serving: "2 pieces", dietCategory: "vegan", category: "Breakfast" },
  { id: "10", name: "Vegetable Sandwich", calories: 280, protein: 8, carbs: 38, fat: 10, serving: "1 sandwich", dietCategory: "veg", category: "Breakfast" },
  { id: "11", name: "Medu Vada", calories: 220, protein: 6, carbs: 20, fat: 12, serving: "2 vadas", dietCategory: "vegan", category: "Breakfast" },
  { id: "12", name: "Pesarattu", calories: 210, protein: 10, carbs: 28, fat: 6, serving: "1 dosa", dietCategory: "vegan", category: "Breakfast" },
  { id: "13", name: "Dal Tadka", calories: 220, protein: 10, carbs: 26, fat: 8, serving: "1 bowl", dietCategory: "veg", category: "Lunch" },
  { id: "14", name: "Rajma", calories: 230, protein: 11, carbs: 34, fat: 5, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "15", name: "Chole", calories: 240, protein: 10, carbs: 32, fat: 8, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "16", name: "Paneer Butter Masala", calories: 330, protein: 12, carbs: 14, fat: 25, serving: "1 bowl", dietCategory: "veg", category: "Lunch" },
  { id: "17", name: "Palak Paneer", calories: 280, protein: 14, carbs: 12, fat: 20, serving: "1 bowl", dietCategory: "veg", category: "Lunch" },
  { id: "18", name: "Mixed Vegetable Curry", calories: 180, protein: 5, carbs: 20, fat: 8, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "19", name: "Baingan Bharta", calories: 170, protein: 4, carbs: 16, fat: 9, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "20", name: "Bhindi Masala", calories: 160, protein: 4, carbs: 15, fat: 8, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "21", name: "Kadhi Pakora", calories: 290, protein: 9, carbs: 24, fat: 16, serving: "1 bowl", dietCategory: "veg", category: "Lunch" },
  { id: "22", name: "Jeera Rice", calories: 210, protein: 4, carbs: 41, fat: 3, serving: "1 cup", dietCategory: "vegan", category: "Lunch" },
  { id: "23", name: "Vegetable Pulao", calories: 240, protein: 6, carbs: 40, fat: 6, serving: "1 cup", dietCategory: "vegan", category: "Lunch" },
  { id: "24", name: "Curd Rice", calories: 260, protein: 8, carbs: 34, fat: 10, serving: "1 bowl", dietCategory: "veg", category: "Lunch" },
  { id: "25", name: "Lemon Rice", calories: 220, protein: 4, carbs: 39, fat: 5, serving: "1 cup", dietCategory: "vegan", category: "Lunch" },
  { id: "26", name: "Sambar Rice", calories: 260, protein: 8, carbs: 42, fat: 6, serving: "1 bowl", dietCategory: "vegan", category: "Lunch" },
  { id: "27", name: "Butter Chicken", calories: 420, protein: 24, carbs: 10, fat: 30, serving: "1 bowl", dietCategory: "nonveg", category: "Dinner" },
  { id: "28", name: "Chicken Curry", calories: 310, protein: 25, carbs: 8, fat: 18, serving: "1 bowl", dietCategory: "nonveg", category: "Dinner" },
  { id: "29", name: "Chicken Biryani", calories: 380, protein: 20, carbs: 40, fat: 15, serving: "1 plate", dietCategory: "nonveg", category: "Dinner" },
  { id: "30", name: "Fish Curry", calories: 280, protein: 23, carbs: 7, fat: 16, serving: "1 bowl", dietCategory: "nonveg", category: "Dinner" },
  { id: "31", name: "Mutton Curry", calories: 370, protein: 22, carbs: 6, fat: 28, serving: "1 bowl", dietCategory: "nonveg", category: "Dinner" },
  { id: "32", name: "Chicken Tikka", calories: 260, protein: 27, carbs: 4, fat: 14, serving: "6 pieces", dietCategory: "nonveg", category: "Dinner" },
  { id: "33", name: "Tandoori Chicken", calories: 300, protein: 30, carbs: 3, fat: 17, serving: "2 pieces", dietCategory: "nonveg", category: "Dinner" },
  { id: "34", name: "Prawn Curry", calories: 290, protein: 21, carbs: 8, fat: 18, serving: "1 bowl", dietCategory: "nonveg", category: "Dinner" },
  { id: "35", name: "Paneer Tikka", calories: 280, protein: 14, carbs: 10, fat: 19, serving: "8 cubes", dietCategory: "veg", category: "Dinner" },
  { id: "36", name: "Veg Biryani", calories: 320, protein: 8, carbs: 48, fat: 10, serving: "1 plate", dietCategory: "vegan", category: "Dinner" },
  { id: "37", name: "Samosa", calories: 250, protein: 5, carbs: 30, fat: 12, serving: "1 piece", dietCategory: "veg", category: "Snacks" },
  { id: "38", name: "Kachori", calories: 280, protein: 6, carbs: 32, fat: 14, serving: "1 piece", dietCategory: "veg", category: "Snacks" },
  { id: "39", name: "Dhokla", calories: 180, protein: 7, carbs: 28, fat: 4, serving: "4 pieces", dietCategory: "vegan", category: "Snacks" },
  { id: "40", name: "Fafda", calories: 210, protein: 5, carbs: 20, fat: 12, serving: "50g", dietCategory: "vegan", category: "Snacks" },
  { id: "41", name: "Pakora", calories: 230, protein: 6, carbs: 18, fat: 14, serving: "6 pieces", dietCategory: "veg", category: "Snacks" },
  { id: "42", name: "Pav Bhaji", calories: 350, protein: 9, carbs: 45, fat: 14, serving: "1 plate", dietCategory: "veg", category: "Snacks" },
  { id: "43", name: "Vada Pav", calories: 290, protein: 7, carbs: 36, fat: 12, serving: "1 piece", dietCategory: "veg", category: "Snacks" },
  { id: "44", name: "Bhel Puri", calories: 180, protein: 5, carbs: 30, fat: 4, serving: "1 bowl", dietCategory: "vegan", category: "Snacks" },
  { id: "45", name: "Sev Puri", calories: 220, protein: 5, carbs: 28, fat: 9, serving: "6 pieces", dietCategory: "veg", category: "Snacks" },
  { id: "46", name: "Pani Puri", calories: 180, protein: 4, carbs: 28, fat: 5, serving: "6 puris", dietCategory: "vegan", category: "Snacks" },
  { id: "47", name: "Roasted Chana", calories: 160, protein: 8, carbs: 22, fat: 3, serving: "40g", dietCategory: "vegan", category: "Snacks" },
  { id: "48", name: "Makhana Roasted", calories: 120, protein: 4, carbs: 18, fat: 3, serving: "30g", dietCategory: "vegan", category: "Snacks" },
  { id: "49", name: "Boiled Egg", calories: 78, protein: 6, carbs: 0.6, fat: 5, serving: "1 egg", dietCategory: "egg", category: "Snacks" },
  { id: "50", name: "Egg Bhurji", calories: 210, protein: 12, carbs: 4, fat: 15, serving: "1 serving", dietCategory: "egg", category: "Breakfast" },
  { id: "51", name: "Egg Curry", calories: 260, protein: 13, carbs: 8, fat: 18, serving: "2 eggs curry", dietCategory: "egg", category: "Lunch" },
  { id: "52", name: "Egg Omelette", calories: 190, protein: 11, carbs: 2, fat: 14, serving: "2-egg omelette", dietCategory: "egg", category: "Breakfast" },
  { id: "53", name: "Masala Chai", calories: 120, protein: 3, carbs: 14, fat: 5, serving: "1 cup", dietCategory: "veg", category: "Beverages" },
  { id: "54", name: "Filter Coffee", calories: 90, protein: 2, carbs: 10, fat: 4, serving: "1 cup", dietCategory: "veg", category: "Beverages" },
  { id: "55", name: "Lassi", calories: 180, protein: 6, carbs: 20, fat: 8, serving: "1 glass", dietCategory: "veg", category: "Beverages" },
  { id: "56", name: "Buttermilk", calories: 60, protein: 3, carbs: 6, fat: 2, serving: "1 glass", dietCategory: "veg", category: "Beverages" },
  { id: "57", name: "Coconut Water", calories: 45, protein: 0.5, carbs: 9, fat: 0, serving: "1 glass", dietCategory: "vegan", category: "Beverages" },
  { id: "58", name: "Sugarcane Juice", calories: 140, protein: 0.2, carbs: 34, fat: 0, serving: "1 glass", dietCategory: "vegan", category: "Beverages" },
  { id: "59", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium", dietCategory: "vegan", category: "Snacks" },
  { id: "60", name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium", dietCategory: "vegan", category: "Snacks" },
];

const normalizeDiet = (diet?: string): "veg" | "eggetarian" | "nonveg" | "vegan" => {
  const value = (diet || "").toLowerCase();
  if (value === "eggitarian" || value === "eggetarian") return "eggetarian";
  if (value === "vegan") return "vegan";
  if (value === "veg") return "veg";
  return "nonveg";
};

const isFoodAllowed = (userDietRaw: string | undefined, category: DietCategory) => {
  const userDiet = normalizeDiet(userDietRaw);
  if (userDiet === "nonveg") return true;
  if (userDiet === "vegan") return category === "vegan";
  if (userDiet === "veg") return category === "veg" || category === "vegan";
  return category === "veg" || category === "vegan" || category === "egg";
};

const LogFoodModal = ({ isOpen, onClose, mealType, onLogFood, userDietType }: LogFoodModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredFoods = useMemo(
    () =>
      commonFoods.filter(
        (food) =>
          isFoodAllowed(userDietType, food.dietCategory) &&
          food.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, userDietType]
  );

  if (!isOpen) return null;

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const handleLogFood = () => {
    if (selectedFood) {
      onLogFood(selectedFood, quantity);
      setSelectedFood(null);
      setQuantity(1);
      setSearchQuery("");
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedFood(null);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center ">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-t-3xl h-[85vh] flex flex-col animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="mobile-title">Log {mealType}</h2>
              <p className="text-sm text-muted-foreground">{selectedFood ? "Adjust quantity" : "Search or select food"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {!selectedFood ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {filteredFoods.length === 0 ? (
                <p className="text-base text-muted-foreground text-center py-8">No foods available for your selected diet.</p>
              ) : (
                <div className="space-y-3">
                  {filteredFoods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{food.name}</p>
                        <p className="text-base text-muted-foreground">{food.serving}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">{food.calories} cal</p>
                        <p className="text-base text-muted-foreground">P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={handleBack} className="text-base text-primary mb-4 flex items-center gap-1 hover:underline">? Back to search</button>

              <div className="bg-secondary/50 rounded-2xl p-4 mb-6">
                <h3 className="text-xl font-display font-bold mb-2">{selectedFood.name}</h3>
                <p className="text-muted-foreground mb-4">{selectedFood.serving} per serving</p>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                    className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-display font-bold">{quantity}</p>
                    <p className="text-base text-muted-foreground">servings</p>
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 0.5)}
                    className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-background">
                    <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-lg font-bold">{Math.round(selectedFood.calories * quantity)}</p>
                    <p className=" text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background">
                    <Beef className="w-5 h-5 text-destructive mx-auto mb-1" />
                    <p className="text-lg font-bold">{Math.round(selectedFood.protein * quantity)}g</p>
                    <p className=" text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background">
                    <Wheat className="w-5 h-5 text-warning mx-auto mb-1" />
                    <p className="text-lg font-bold">{Math.round(selectedFood.carbs * quantity)}g</p>
                    <p className=" text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background">
                    <Droplets className="w-5 h-5 text-info mx-auto mb-1" />
                    <p className="text-lg font-bold">{Math.round(selectedFood.fat * quantity)}g</p>
                    <p className="text-base text-muted-foreground">Fat</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedFood && (
          <div className="p-4 border-t border-border">
            <Button onClick={handleLogFood} className="w-full" size="lg">
              <Plus className="w-5 h-5" />
              Add to {mealType}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogFoodModal;


