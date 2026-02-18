import { useState, useEffect } from "react";

import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Weight, 
  Ruler, 
  Calendar, 
  Clock, 
  Target,
  Utensils,
  Edit3,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";


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

const Profile = () => {
  const navigate = useNavigate();
  const {toast} = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const getGoalLabel = (goal: string) => {
    const goals: Record<string, string> = {
      lose: "Lose Weight",
      build: "Build Muscle",
      maintain: "Maintain Weight",
      endurance: "Improve Endurance",
    };
    return goals[goal] || goal;
  };

  const getDietLabel = (diet: string) => {
    const diets: Record<string, string> = {
      veg: "Vegetarian",
      nonveg: "Non-Vegetarian",
      eggetarian: "Eggetarian",
      vegan: "Vegan",
    };
    return diets[diet] || diet;
  };

  const handleLogout = async () => {
  try {
    await signOut(auth);

    toast({
      title: "Logged out successfully",
      description: "You have been signed out.",
    });

    navigate("/login");

  } catch (error) {
    console.error("Logout error:", error);

    toast({
      title: "Logout Failed",
      description: "Something went wrong.",
      variant: "destructive",
    });
  }
};
  const profileStats = profile ? [
    { icon: Weight, label: "Weight", value: `${profile.weight} kg`, color: "text-accent" },
    { icon: Ruler, label: "Height", value: `${profile.height} cm`, color: "text-primary" },
    { icon: Calendar, label: "Age", value: `${profile.age} years`, color: "text-info" },
    { icon: Clock, label: "Weekly Hours", value: `${profile.weeklyHours} hrs`, color: "text-warning" },
  ] : [];

  const menuItems = profile ? [
    { icon: Target, label: "Fitness Goal", value: getGoalLabel(profile.goal) },
    { icon: Utensils, label: "Diet Preference", value: getDietLabel(profile.dietType) },
    { icon: Bell, label: "Notifications", value: "Enabled" },
    { icon: Shield, label: "Privacy", value: "" },
    { icon: Settings, label: "Settings", value: "" },
  ] : [];

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      {/* Background Effects */}
      <div className="    pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 mobile-header">
        <div className="flex items-center justify-between">
          
          <Button variant="ghost" size="icon" onClick={() => navigate("/onboarding")}>
            <Edit3 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="relative z-10 text-center mb-8 animate-slide-up">
        <div className="relative inline-block">
          <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.3)] mx-auto">
            <User className="w-14 h-14 text-primary-foreground" />
          </div>
          <button 
            onClick={() => navigate("/onboarding")}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-[0_4px_20px_hsl(var(--accent)/0.4)]"
          >
            <Edit3 className="w-5 h-5 text-accent-foreground" />
          </button>
        </div>
        <h1 className="mobile-title text-foreground mt-4">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">{profile.hasHecticSchedule ? "Hectic Schedule" : "Regular Schedule"}</p>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-2 gap-4">
          {profileStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl p-5 border border-border/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="card-number text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Badge */}
      <div className="relative z-10 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="bg-card rounded-2xl p-5 border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Schedule Type</p>
              <p className="text-sm text-muted-foreground">
                {profile.hasHecticSchedule ? "Hectic - Flexible workouts" : "Regular - Consistent timing"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Menu Items */}
      <div className="relative z-10 space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="mobile-title text-foreground mb-4">Preferences</h2>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.label === "Settings") {
                navigate("/settings");
              }
              // Other menu items can be handled here
            }}
            className="w-full bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                {item.value && <p className="text-sm text-muted-foreground">{item.value}</p>}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="relative z-10 mt-8 mb-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
        <Button 
          variant="outline" 
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Profile;
