import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useEffect } from "react";
import { getDoc } from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { 
  User, 
  Weight, 
  Ruler, 
  Calendar, 
  Clock, 
  Target, 
  Utensils,
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  weight: string;
  height: string;
  age: string;
  weeklyHours: string;
  hasHecticSchedule: boolean;
  goal: string;
  dietType: string;
}

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    weight: "",
    height: "",
    age: "",
    weeklyHours: "",
    hasHecticSchedule: false,
    goal: "",
    dietType: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
  const checkProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docSnap = await getDoc(doc(db, "users", user.uid));

    if (docSnap.exists() && docSnap.data().profileCompleted) {
      navigate("/home");
    }
  };

  checkProfile();
}, []);


  const totalSteps = 4;

  const goals = [
    { id: "lose", label: "Lose Weight", icon: "🔥" },
    { id: "build", label: "Build Muscle", icon: "💪" },
    { id: "maintain", label: "Maintain Weight", icon: "⚖️" },
    { id: "endurance", label: "Improve Endurance", icon: "🏃" },
  ];

  const dietTypes = [
    { id: "veg", label: "Vegetarian", icon: "🥬" },
    { id: "nonveg", label: "Non-Vegetarian", icon: "🍗" },
    { id: "eggetarian", label: "Eggetarian", icon: "🥚" },
    { id: "vegan", label: "Vegan", icon: "🌱" },
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
  try {
    setIsLoading(true);

    const user = auth.currentUser;

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    await setDoc(
  doc(db, "users", user.uid), {
      name: profile.name,
      weight: Number(profile.weight),
      height: Number(profile.height),
      age: Number(profile.age),
      weeklyHours: Number(profile.weeklyHours),
      hasHecticSchedule: profile.hasHecticSchedule,
      goal: profile.goal,
      dietType: profile.dietType,
      profileCompleted: true,
    });

    toast({
      title: "Profile Created!",
      description: "Your fitness journey starts now.",
    });

    // Persist profile locally so Home/Profile load the newest data immediately
    try {
      localStorage.setItem("userProfile", JSON.stringify({
        name: profile.name,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        weeklyHours: profile.weeklyHours,
        hasHecticSchedule: profile.hasHecticSchedule,
        goal: profile.goal,
        dietType: profile.dietType,
      }));
      localStorage.setItem("onboardingComplete", "true");
    } catch (err) {
      console.warn("Failed to write profile to localStorage:", err);
    }

    navigate("/home");

  } catch (error) {
    console.error("Onboarding error:", error);
    toast({
      title: "Error",
      description: "Something went wrong while saving profile.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  const isStepValid = () => {
    switch (step) {
      case 1:
        return profile.name.trim() !== "";
      case 2:
        return profile.weight !== "" && profile.height !== "" && profile.age !== "";
      case 3:
        return profile.weeklyHours !== "" && profile.goal !== "";
      case 4:
        return profile.dietType !== "";
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden overflow-y-auto">
      {/* Background Effects */}
      <div className="    pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
          <span className="text-sm font-medium text-primary">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full  ">
          <div 
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-8 relative z-10">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h1 className="mobile-title text-foreground mb-2">
                What's your name?
              </h1>
              <p className="text-muted-foreground">Let's personalize your fitness journey</p>
            </div>
            <Input
              type="text"
              placeholder="Enter your name"
              icon={<User className="w-5 h-5" />}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mb-6"
            />
          </div>
        )}

        {/* Step 2: Body Stats */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/20 mb-6">
                <Ruler className="w-10 h-10 text-accent" />
              </div>
              <h1 className="mobile-title text-foreground mb-2">
                Your body stats
              </h1>
              <p className="text-muted-foreground">This helps us calculate your needs</p>
            </div>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Weight (kg)"
                icon={<Weight className="w-5 h-5" />}
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Height (cm)"
                icon={<Ruler className="w-5 h-5" />}
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Age (years)"
                icon={<Calendar className="w-5 h-5" />}
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Schedule & Goal */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h1 className="mobile-title text-foreground mb-2">
                Your schedule & goal
              </h1>
              <p className="text-muted-foreground">We'll create a plan that fits your life</p>
            </div>
            
            <div className="space-y-6">
              <Input
                type="number"
                placeholder="Weekly workout hours available"
                icon={<Clock className="w-5 h-5" />}
                value={profile.weeklyHours}
                onChange={(e) => setProfile({ ...profile, weeklyHours: e.target.value })}
              />
              
              <div>
                <p className="text-sm text-muted-foreground mb-3">Do you have a hectic schedule?</p>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, hasHecticSchedule: true })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      profile.hasHecticSchedule 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-secondary/50 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl mb-2 block">😵</span>
                    <span className="font-medium">Yes, hectic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, hasHecticSchedule: false })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      !profile.hasHecticSchedule 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-secondary/50 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl mb-2 block">😌</span>
                    <span className="font-medium">No, regular</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">What's your fitness goal?</p>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setProfile({ ...profile, goal: goal.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        profile.goal === goal.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-secondary/50 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl mb-2 block">{goal.icon}</span>
                      <span className="font-medium text-sm">{goal.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Diet Preference */}
        {step === 4 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/20 mb-6">
                <Utensils className="w-10 h-10 text-success" />
              </div>
              <h1 className="mobile-title text-foreground mb-2">
                Your diet preference
              </h1>
              <p className="text-muted-foreground">We'll suggest meals accordingly</p>
            </div>
            
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              {dietTypes.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, dietType: diet.id })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    profile.dietType === diet.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-secondary/50 hover:border-primary/50'
                  }`}
                >
                  <span className="text-4xl mb-3 block">{diet.icon}</span>
                  <span className="font-medium">{diet.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="relative z-10 pb-6 flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        )}
        {step < totalSteps ? (
          <Button 
            onClick={handleNext} 
            disabled={!isStepValid()} 
            className="flex-1"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={!isStepValid() || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Complete Setup
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
