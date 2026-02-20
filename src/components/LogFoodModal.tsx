import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Search, 
  Plus,
  Minus,
  Utensils,
  Flame,
  Beef,
  Wheat,
  Droplets
} from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: string;
  onLogFood: (food: FoodItem, quantity: number) => void;
}

const commonFoods: FoodItem[] = [
  { id: "1", name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
  { id: "2", name: "Brown Rice", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, serving: "100g" },
  { id: "3", name: "Boiled Eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: "2 eggs" },
  { id: "4", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
  { id: "5", name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fat: 3, serving: "1 cup" },
  { id: "6", name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: "170g" },
  { id: "7", name: "Paneer", calories: 265, protein: 18, carbs: 1.2, fat: 21, serving: "100g" },
  { id: "8", name: "Dal (Lentils)", calories: 116, protein: 9, carbs: 20, fat: 0.4, serving: "1 cup" },
  { id: "9", name: "Roti (Whole Wheat)", calories: 120, protein: 3, carbs: 25, fat: 1, serving: "1 piece" },
  { id: "10", name: "Mixed Vegetables", calories: 65, protein: 2.5, carbs: 13, fat: 0.3, serving: "1 cup" },
  { id: "11", name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100g" },
  { id: "12", name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium" },
];

const LogFoodModal = ({ isOpen, onClose, mealType, onLogFood }: LogFoodModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const filteredFoods = commonFoods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-t-3xl h-[85vh] flex flex-col animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="mobile-title">Log {mealType}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedFood ? "Adjust quantity" : "Search or select food"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {!selectedFood ? (
            <>
              {/* Search */}
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

              {/* Food List */}
              <div className="space-y-3">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {food.name}
                      </p>
                      <p className="text-base text-muted-foreground">{food.serving}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">{food.calories} cal</p>
                      <p className="text-base text-muted-foreground">
                        P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Food Details */}
              <button
                onClick={handleBack}
                className="text-base text-primary mb-4 flex items-center gap-1 hover:underline"
              >
                ← Back to search
              </button>

              <div className="bg-secondary/50 rounded-2xl p-4 mb-6">
                <h3 className="text-xl font-display font-bold mb-2">{selectedFood.name}</h3>
                <p className="text-muted-foreground mb-4">{selectedFood.serving} per serving</p>
                
                {/* Quantity Selector */}
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

                {/* Nutrition Summary */}
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

        {/* Footer */}
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
