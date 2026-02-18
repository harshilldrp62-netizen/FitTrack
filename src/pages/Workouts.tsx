import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Dumbbell,
  Clock,
  Flame,
  Play,
  Check,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";
import WorkoutDetail from "@/components/WorkoutDetail.tsx";

interface Workout {
  id: string;
  name: string;
  duration: string;
  calories: number;
  exercises: number;
  difficulty: "Easy" | "Medium" | "Hard";
  type: string;
  completed?: boolean;
}

interface UserProfile {
  goal: string;
  weeklyHours: string;
  hasHecticSchedule: boolean;
}

const Workouts = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [filterType, setFilterType] = useState<string>("All");

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    const today = new Date().toDateString();
    const saved = localStorage.getItem(`completedWorkouts_${today}`);
    if (saved) {
      setCompletedWorkouts(JSON.parse(saved));
    }
  }, []);

  const getWorkoutsForGoal = (): Workout[] => {
    const goal = profile?.goal || "maintain";
    const workoutsByGoal: Record<string, Workout[]> = {
      lose: [
        { id: "1", name: "HIIT Cardio", duration: "30 min", calories: 350, exercises: 8, difficulty: "Hard", type: "Cardio" },
        { id: "2", name: "Full Body Burn", duration: "45 min", calories: 400, exercises: 12, difficulty: "Medium", type: "Strength" },
        { id: "3", name: "Morning Run", duration: "25 min", calories: 280, exercises: 1, difficulty: "Easy", type: "Cardio" },
        { id: "4", name: "Core Crusher", duration: "20 min", calories: 180, exercises: 10, difficulty: "Medium", type: "Core" },
      ],
      build: [
        { id: "1", name: "Upper Body Power", duration: "50 min", calories: 320, exercises: 10, difficulty: "Hard", type: "Strength" },
        { id: "2", name: "Leg Day", duration: "55 min", calories: 380, exercises: 8, difficulty: "Hard", type: "Strength" },
        { id: "3", name: "Push Pull", duration: "45 min", calories: 290, exercises: 12, difficulty: "Medium", type: "Strength" },
        { id: "4", name: "Back & Biceps", duration: "40 min", calories: 250, exercises: 8, difficulty: "Medium", type: "Strength" },
      ],
      maintain: [
        { id: "1", name: "Full Body Workout", duration: "40 min", calories: 280, exercises: 10, difficulty: "Medium", type: "Strength" },
        { id: "2", name: "Cardio Mix", duration: "30 min", calories: 250, exercises: 6, difficulty: "Easy", type: "Cardio" },
        { id: "3", name: "Yoga Flow", duration: "35 min", calories: 150, exercises: 15, difficulty: "Easy", type: "Flexibility" },
        { id: "4", name: "Core Stability", duration: "25 min", calories: 160, exercises: 8, difficulty: "Medium", type: "Core" },
      ],
      endurance: [
        { id: "1", name: "Long Run", duration: "60 min", calories: 550, exercises: 1, difficulty: "Hard", type: "Cardio" },
        { id: "2", name: "Interval Training", duration: "40 min", calories: 400, exercises: 10, difficulty: "Hard", type: "Cardio" },
        { id: "3", name: "Cycling Session", duration: "45 min", calories: 380, exercises: 1, difficulty: "Medium", type: "Cardio" },
        { id: "4", name: "Swimming", duration: "50 min", calories: 420, exercises: 1, difficulty: "Medium", type: "Cardio" },
      ],
    };

    return workoutsByGoal[goal] || workoutsByGoal.maintain;
  };

  const weekSchedule = [
    { day: 0, workout: null, rest: true },
    { day: 1, workout: getWorkoutsForGoal()[0] },
    { day: 2, workout: getWorkoutsForGoal()[1] },
    { day: 3, workout: getWorkoutsForGoal()[2] },
    { day: 4, workout: null, rest: true },
    { day: 5, workout: getWorkoutsForGoal()[3] },
    { day: 6, workout: getWorkoutsForGoal()[0] },
  ];

  const toggleComplete = (workoutId: string) => {
    const today = new Date().toDateString();
    const newCompleted = completedWorkouts.includes(workoutId)
      ? completedWorkouts.filter(id => id !== workoutId)
      : [...completedWorkouts, workoutId];
    
    setCompletedWorkouts(newCompleted);
    localStorage.setItem(`completedWorkouts_${today}`, JSON.stringify(newCompleted));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-success bg-success/20";
      case "Medium": return "text-warning bg-warning/20";
      case "Hard": return "text-destructive bg-destructive/20";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  const todaySchedule = weekSchedule[selectedDay];

  // Show workout detail view
  if (selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onBack={() => setSelectedWorkout(null)}
        onComplete={() => toggleComplete(selectedWorkout.id)}
        isCompleted={completedWorkouts.includes(selectedWorkout.id)}
      />
    );
  }

  return (
    <div className="mobile-page">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
            <h1 className="mobile-title text-foreground">Workouts</h1>
            <p className="text-sm text-muted-foreground">Your personalized plan</p>
          </div>
        </div>
      </header>

      {/* Week Selector */}
      <div className="relative z-10 mb-6 animate-slide-up">
        <div className="flex justify-between gap-2">
          {days.map((day, idx) => {
            const isToday = idx === new Date().getDay();
            const isSelected = idx === selectedDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`flex-1 py-3 rounded-xl text-center transition-all ${
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : isToday 
                      ? "bg-primary/20 text-primary" 
                      : "bg-card text-muted-foreground"
                }`}
              >
                <p className="text-xs font-medium">{day}</p>
                <p className="text-sm font-bold">{new Date(Date.now() + (idx - new Date().getDay()) * 86400000).getDate()}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="relative z-10 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xl font-semibold mb-4">{days[selectedDay]}'s Schedule</h2>
        {todaySchedule.rest ? (
          <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🧘</span>
            </div>
            <h3 className="mobile-title mb-2">Rest Day</h3>
            <p className="text smtext-muted-foreground">Take it easy! Recovery is just as important as training.</p>
          </div>
        ) : todaySchedule.workout ? (
          <div 
            className="bg-card rounded-2xl p-4 border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedWorkout(todaySchedule.workout!)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="mobile-title">{todaySchedule.workout.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(todaySchedule.workout.difficulty)}`}>
                    {todaySchedule.workout.difficulty}
                  </span>
                </div>
              </div>
              <span className="text-xs bg-secondary px-3 py-1 rounded-full">{todaySchedule.workout.type}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{todaySchedule.workout.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-sm">{todaySchedule.workout.calories} cal</span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{todaySchedule.workout.exercises} exercises</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
  <Button
    className="flex-1"
    size="lg"
    variant={completedWorkouts.includes(todaySchedule.workout.id) ? "outline" : "default"}
    onClick={(e) => {
      e.stopPropagation();
      toggleComplete(todaySchedule.workout!.id);
    }}
  >
    {completedWorkouts.includes(todaySchedule.workout.id) ? (
      <>
        <Check className="w-5 h-5 mr-2" />
        Completed
      </>
    ) : (
      <>
        <Play className="w-5 h-5 mr-2" />
        Start Workout
      </>
    )}
  </Button>

  <Button
    variant="outline"
    className="flex-1"
    size="lg"
    onClick={(e) => {
      e.stopPropagation();
      setSelectedWorkout(todaySchedule.workout!);
    }}
  >
    View Details
  </Button>
</div>

          </div>
        ) : null}
      </div>

      {/* Filter Tabs */}
      <div className="relative z-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Strength">Strength</TabsTrigger>
            <TabsTrigger value="Cardio">Cardio</TabsTrigger>
            <TabsTrigger value="Flexibility">Flexibility</TabsTrigger>
            <TabsTrigger value="HIIT">HIIT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* All Workouts */}
      <div className="relative z-10 animate-slide-up mt-4" style={{ animationDelay: "0.25s" }}>
  <h2 className="text-xl font-semibold mb-4">
    {filterType === "All" ? "All Workouts" : `${filterType} Workouts`}
  </h2>

        <div className="space-y-3">
          {getWorkoutsForGoal()
            .filter((workout) => {
              if (filterType === "All") return true;
              if (filterType === "HIIT") return workout.name.includes("HIIT");
              return workout.type === filterType;
            })
            .map((workout) => (
              <button
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className="w-full bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{workout.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workout.duration} • {workout.calories} cal • {workout.difficulty}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Workouts;
