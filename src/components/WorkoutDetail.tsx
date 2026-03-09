import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Clock, Flame, Dumbbell, Play, Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DailyMetricsService, { localDateId } from "@/services/DailyMetricsService";
import { db, auth } from "@/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  muscleGroup: string;
  instructions: string;
  tips: string[];
  completed?: boolean;
}

interface WorkoutDetailProps {
  workout: {
    id: string;
    name: string;
    duration: string;
    calories: number;
    exercises: number;
    difficulty: string;
    type: string;
  };
  canStartTraining: boolean;
  onBack: () => void;
  onComplete: () => void;
  isCompleted: boolean;
}

type ExerciseGoalTag = "muscle" | "fat_loss" | "weight_gain" | "endurance";
type IntensityLevel = "low" | "moderate" | "high";
type ConfirmDialogType = "start" | "reset" | "complete" | "finish" | null;

const exerciseDatabase: Record<string, Exercise[]> = {
  "Upper Body Power": [
    {
      id: "ub1",
      name: "Bench Press",
      sets: 4,
      reps: "8-10",
      restTime: "90 sec",
      muscleGroup: "Chest",
      instructions: "Lie on bench, grip bar slightly wider than shoulder-width. Lower to chest, push back up.",
      tips: ["Keep back slightly arched", "Feet flat on floor", "Control the descent"]
    },
    {
      id: "ub2",
      name: "Overhead Shoulder Press",
      sets: 4,
      reps: "8-12",
      restTime: "60 sec",
      muscleGroup: "Shoulders",
      instructions: "Stand with dumbbells at shoulder height. Press overhead until arms are extended.",
      tips: ["Engage core", "Don't arch lower back", "Full range of motion"]
    },
    {
      id: "ub3",
      name: "Bent Over Rows",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Back",
      instructions: "Hinge at hips, pull weight to lower chest. Squeeze shoulder blades together.",
      tips: ["Keep back flat", "Pull elbows back, not up", "Control the negative"]
    },
    {
      id: "ub4",
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Upper Chest",
      instructions: "Set bench to 30-45°. Press dumbbells up from chest level.",
      tips: ["Touch dumbbells at top", "Keep shoulders back", "Breathe out on push"]
    },
    {
      id: "ub5",
      name: "Lateral Raises",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Side Delts",
      instructions: "Raise dumbbells to sides until arms parallel to floor.",
      tips: ["Slight bend in elbows", "Lead with elbows", "Don't swing weights"]
    },
    {
      id: "ub6",
      name: "Tricep Dips",
      sets: 3,
      reps: "10-15",
      restTime: "60 sec",
      muscleGroup: "Triceps",
      instructions: "Lower body by bending elbows to 90°, push back up.",
      tips: ["Keep elbows close to body", "Lean slightly forward", "Full lockout at top"]
    },
    {
      id: "ub7",
      name: "Bicep Curls",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Biceps",
      instructions: "Curl weights keeping elbows stationary at sides.",
      tips: ["No swinging", "Squeeze at top", "Slow negative"]
    },
    {
      id: "ub8",
      name: "Face Pulls",
      sets: 3,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Rear Delts",
      instructions: "Pull rope to face level, spreading handles apart.",
      tips: ["High elbows", "Squeeze shoulder blades", "Great for posture"]
    },
    {
      id: "ub9",
      name: "Close-Grip Push-ups",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Triceps/Chest",
      instructions: "Hands closer than shoulder width, lower chest to floor.",
      tips: ["Keep core tight", "Elbows close to body", "Full range of motion"]
    },
    {
      id: "ub10",
      name: "Plank Hold",
      sets: 3,
      reps: "30-45 sec",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Hold push-up position on forearms, body straight.",
      tips: ["Don't let hips sag", "Engage glutes", "Breathe normally"]
    }
  ],
  "Leg Day": [
    {
      id: "lg1",
      name: "Barbell Squats",
      sets: 4,
      reps: "8-10",
      restTime: "120 sec",
      muscleGroup: "Quads/Glutes",
      instructions: "Bar on upper back, squat down until thighs parallel, drive up through heels.",
      tips: ["Keep chest up", "Knees track over toes", "Breathe in on descent"]
    },
    {
      id: "lg2",
      name: "Romanian Deadlifts",
      sets: 4,
      reps: "10-12",
      restTime: "90 sec",
      muscleGroup: "Hamstrings/Glutes",
      instructions: "Hinge at hips, lower weight along legs. Feel stretch in hamstrings.",
      tips: ["Slight knee bend", "Back stays flat", "Push hips back"]
    },
    {
      id: "lg3",
      name: "Walking Lunges",
      sets: 3,
      reps: "12 each leg",
      restTime: "60 sec",
      muscleGroup: "Quads/Glutes",
      instructions: "Step forward into lunge, knee at 90°. Alternate legs.",
      tips: ["Keep torso upright", "Front knee over ankle", "Push through front heel"]
    },
    {
      id: "lg4",
      name: "Leg Press",
      sets: 4,
      reps: "12-15",
      restTime: "60 sec",
      muscleGroup: "Quads",
      instructions: "Push platform away, lower with control. Don't lock knees.",
      tips: ["Feet shoulder-width", "Full range of motion", "Control the negative"]
    },
    {
      id: "lg5",
      name: "Leg Curls",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Hamstrings",
      instructions: "Curl pad toward glutes, squeeze at top.",
      tips: ["Don't lift hips", "Control the motion", "Point toes down"]
    },
    {
      id: "lg6",
      name: "Calf Raises",
      sets: 4,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Calves",
      instructions: "Rise onto toes, squeeze calves at top, lower slowly.",
      tips: ["Full stretch at bottom", "Hold top for 1 sec", "Vary foot position"]
    },
    {
      id: "lg7",
      name: "Bulgarian Split Squats",
      sets: 3,
      reps: "10 each leg",
      restTime: "60 sec",
      muscleGroup: "Quads/Glutes",
      instructions: "Rear foot on bench, lower until front thigh parallel.",
      tips: ["Keep torso upright", "Drive through front heel", "Control balance"]
    },
    {
      id: "lg8",
      name: "Hip Thrusts",
      sets: 3,
      reps: "12-15",
      restTime: "60 sec",
      muscleGroup: "Glutes",
      instructions: "Upper back on bench, thrust hips up, squeeze glutes.",
      tips: ["Chin tucked", "Full hip extension", "Pause at top"]
    }
  ],
  "Push Pull": [
    {
      id: "pp1",
      name: "Push-ups",
      sets: 4,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Chest/Triceps",
      instructions: "Lower chest to floor, push back up with arms extended.",
      tips: ["Body stays straight", "Elbows at 45°", "Full range of motion"]
    },
    {
      id: "pp2",
      name: "Pull-ups",
      sets: 4,
      reps: "8-12",
      restTime: "60 sec",
      muscleGroup: "Back/Biceps",
      instructions: "Pull body up until chin over bar, lower with control.",
      tips: ["Lead with chest", "Squeeze shoulder blades", "Use bands if needed"]
    },
    {
      id: "pp3",
      name: "Dumbbell Shoulder Press",
      sets: 3,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Shoulders",
      instructions: "Press dumbbells overhead from shoulder height.",
      tips: ["Core engaged", "Don't arch back", "Full lockout"]
    },
    {
      id: "pp4",
      name: "Inverted Rows",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Back",
      instructions: "Pull chest to bar while body stays straight.",
      tips: ["Squeeze shoulder blades", "Keep hips up", "Control descent"]
    },
    {
      id: "pp5",
      name: "Diamond Push-ups",
      sets: 3,
      reps: "10-15",
      restTime: "45 sec",
      muscleGroup: "Triceps",
      instructions: "Hands form diamond shape, lower chest to hands.",
      tips: ["Elbows close to body", "Core tight", "Slow and controlled"]
    },
    {
      id: "pp6",
      name: "Dumbbell Rows",
      sets: 3,
      reps: "12 each arm",
      restTime: "45 sec",
      muscleGroup: "Lats",
      instructions: "One hand on bench, row weight to hip.",
      tips: ["Keep back flat", "Pull elbow back", "Squeeze at top"]
    },
    {
      id: "pp7",
      name: "Pike Push-ups",
      sets: 3,
      reps: "10-12",
      restTime: "45 sec",
      muscleGroup: "Shoulders",
      instructions: "Hips high in pike position, lower head toward floor.",
      tips: ["Look at feet", "Elbows flare slightly", "Great shoulder builder"]
    },
    {
      id: "pp8",
      name: "Chin-ups",
      sets: 3,
      reps: "8-10",
      restTime: "60 sec",
      muscleGroup: "Biceps/Back",
      instructions: "Underhand grip, pull chin over bar.",
      tips: ["Full range of motion", "Control negative", "Squeeze biceps"]
    },
    {
      id: "pp9",
      name: "Dips",
      sets: 3,
      reps: "10-15",
      restTime: "60 sec",
      muscleGroup: "Chest/Triceps",
      instructions: "Lower body by bending elbows, push back up.",
      tips: ["Lean forward for chest", "Stay upright for triceps", "90° elbow bend"]
    },
    {
      id: "pp10",
      name: "Face Pulls",
      sets: 3,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Rear Delts",
      instructions: "Pull rope to face, externally rotate shoulders.",
      tips: ["High elbows", "Great for posture", "Light weight, high reps"]
    },
    {
      id: "pp11",
      name: "Tricep Pushdowns",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Triceps",
      instructions: "Push cable down, elbows stay at sides.",
      tips: ["Full extension", "Don't swing", "Squeeze triceps"]
    },
    {
      id: "pp12",
      name: "Hammer Curls",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Biceps",
      instructions: "Neutral grip curls, palms face each other.",
      tips: ["No swinging", "Slow negative", "Works brachialis too"]
    }
  ],
  "Back & Biceps": [
    {
      id: "bb1",
      name: "Lat Pulldowns",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Lats",
      instructions: "Pull bar to upper chest, squeeze lats, return slowly.",
      tips: ["Lean back slightly", "Drive elbows down", "Full stretch at top"]
    },
    {
      id: "bb2",
      name: "Seated Cable Rows",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Mid Back",
      instructions: "Pull handle to waist, squeeze shoulder blades.",
      tips: ["Keep chest up", "Don't round back", "Full extension"]
    },
    {
      id: "bb3",
      name: "Single-Arm Dumbbell Rows",
      sets: 3,
      reps: "12 each arm",
      restTime: "45 sec",
      muscleGroup: "Lats",
      instructions: "Row dumbbell to hip, keep back flat.",
      tips: ["Elbow close to body", "Full stretch", "Squeeze at top"]
    },
    {
      id: "bb4",
      name: "Barbell Curls",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Biceps",
      instructions: "Curl bar with elbows at sides, squeeze at top.",
      tips: ["No swinging", "Control negative", "Keep elbows still"]
    },
    {
      id: "bb5",
      name: "Preacher Curls",
      sets: 3,
      reps: "10-12",
      restTime: "45 sec",
      muscleGroup: "Biceps",
      instructions: "Curl on preacher bench, arms fully supported.",
      tips: ["Full range of motion", "No cheating", "Great isolation"]
    },
    {
      id: "bb6",
      name: "Reverse Flyes",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Rear Delts",
      instructions: "Bent over, raise arms out to sides.",
      tips: ["Slight elbow bend", "Squeeze shoulder blades", "Light weight"]
    },
    {
      id: "bb7",
      name: "Incline Dumbbell Curls",
      sets: 3,
      reps: "10-12",
      restTime: "45 sec",
      muscleGroup: "Biceps",
      instructions: "Curl on incline bench for full stretch.",
      tips: ["Arms hang down", "Full range of motion", "Great stretch"]
    },
    {
      id: "bb8",
      name: "Shrugs",
      sets: 3,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Traps",
      instructions: "Elevate shoulders straight up, hold, lower.",
      tips: ["Don't roll shoulders", "Hold at top", "Heavy weight okay"]
    }
  ],
  "HIIT Cardio": [
    {
      id: "hc1",
      name: "Jumping Jacks",
      sets: 3,
      reps: "45 sec",
      restTime: "15 sec",
      muscleGroup: "Full Body",
      instructions: "Jump feet out while raising arms overhead, return.",
      tips: ["Land softly", "Keep core engaged", "Warm-up exercise"]
    },
    {
      id: "hc2",
      name: "Burpees",
      sets: 4,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Full Body",
      instructions: "Squat, jump to plank, push-up, jump back, jump up.",
      tips: ["Move quickly", "Full push-up", "Explosive jump"]
    },
    {
      id: "hc3",
      name: "Mountain Climbers",
      sets: 4,
      reps: "40 sec",
      restTime: "20 sec",
      muscleGroup: "Core/Cardio",
      instructions: "Plank position, drive knees to chest alternately.",
      tips: ["Keep hips low", "Move fast", "Breathe rhythmically"]
    },
    {
      id: "hc4",
      name: "High Knees",
      sets: 4,
      reps: "40 sec",
      restTime: "20 sec",
      muscleGroup: "Legs/Cardio",
      instructions: "Run in place, driving knees high.",
      tips: ["Pump arms", "Land on balls of feet", "Core tight"]
    },
    {
      id: "hc5",
      name: "Box Jumps",
      sets: 3,
      reps: "10-12",
      restTime: "30 sec",
      muscleGroup: "Legs/Power",
      instructions: "Jump onto box, step down, repeat.",
      tips: ["Land softly", "Full hip extension", "Use arms for momentum"]
    },
    {
      id: "hc6",
      name: "Squat Jumps",
      sets: 4,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Legs",
      instructions: "Squat down, explode up into jump, repeat.",
      tips: ["Land softly", "Chest up", "Full depth squat"]
    },
    {
      id: "hc7",
      name: "Plank Jacks",
      sets: 3,
      reps: "30 sec",
      restTime: "15 sec",
      muscleGroup: "Core/Cardio",
      instructions: "Plank position, jump feet out and in like jumping jacks.",
      tips: ["Keep hips steady", "Core tight", "Stay low"]
    },
    {
      id: "hc8",
      name: "Sprint Intervals",
      sets: 5,
      reps: "20 sec sprint",
      restTime: "40 sec",
      muscleGroup: "Full Body",
      instructions: "All-out sprint followed by walking recovery.",
      tips: ["True max effort", "Pump arms hard", "Recover completely"]
    }
  ],
  "Full Body Burn": [
    {
      id: "fb1",
      name: "Goblet Squats",
      sets: 4,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Legs",
      instructions: "Hold weight at chest, squat deep, stand up.",
      tips: ["Keep chest up", "Push knees out", "Full depth"]
    },
    {
      id: "fb2",
      name: "Push-up to Row",
      sets: 3,
      reps: "10 each side",
      restTime: "45 sec",
      muscleGroup: "Chest/Back",
      instructions: "Push-up, then row dumbbell at top. Alternate sides.",
      tips: ["Wide stance for balance", "Control the row", "Full push-up"]
    },
    {
      id: "fb3",
      name: "Dumbbell Thrusters",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Full Body",
      instructions: "Front squat into overhead press in one motion.",
      tips: ["Use leg drive", "Full lockout", "Core tight"]
    },
    {
      id: "fb4",
      name: "Kettlebell Swings",
      sets: 4,
      reps: "15-20",
      restTime: "45 sec",
      muscleGroup: "Posterior Chain",
      instructions: "Hip hinge, swing weight to chest height using hips.",
      tips: ["Hips, not arms", "Snap hips forward", "Squeeze glutes at top"]
    },
    {
      id: "fb5",
      name: "Reverse Lunges",
      sets: 3,
      reps: "12 each leg",
      restTime: "45 sec",
      muscleGroup: "Legs",
      instructions: "Step back into lunge, return to standing.",
      tips: ["90° angles", "Drive through front heel", "Keep torso upright"]
    },
    {
      id: "fb6",
      name: "Renegade Rows",
      sets: 3,
      reps: "10 each arm",
      restTime: "45 sec",
      muscleGroup: "Core/Back",
      instructions: "Plank on dumbbells, row one at a time.",
      tips: ["Don't rotate hips", "Wide feet for stability", "Squeeze at top"]
    },
    {
      id: "fb7",
      name: "Deadlifts",
      sets: 4,
      reps: "10-12",
      restTime: "60 sec",
      muscleGroup: "Posterior Chain",
      instructions: "Hinge at hips, lift weight by driving hips forward.",
      tips: ["Bar close to body", "Back flat", "Drive through heels"]
    },
    {
      id: "fb8",
      name: "Plank to Push-up",
      sets: 3,
      reps: "10-12",
      restTime: "45 sec",
      muscleGroup: "Core/Arms",
      instructions: "From forearm plank, press up to push-up, return.",
      tips: ["Alternate leading arm", "Minimize hip rock", "Core tight"]
    },
    {
      id: "fb9",
      name: "Box Step-ups",
      sets: 3,
      reps: "12 each leg",
      restTime: "45 sec",
      muscleGroup: "Legs",
      instructions: "Step onto box, drive through heel, step down.",
      tips: ["Knee over ankle", "Full hip extension", "Control descent"]
    },
    {
      id: "fb10",
      name: "Battle Ropes",
      sets: 4,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Full Body",
      instructions: "Create waves with alternating arm movements.",
      tips: ["Stay low", "Use whole body", "Keep rhythm"]
    },
    {
      id: "fb11",
      name: "Russian Twists",
      sets: 3,
      reps: "20 total",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Seated, lean back, rotate torso side to side.",
      tips: ["Feet up for challenge", "Touch floor each side", "Control tempo"]
    },
    {
      id: "fb12",
      name: "Farmer's Walk",
      sets: 3,
      reps: "40 sec",
      restTime: "45 sec",
      muscleGroup: "Full Body",
      instructions: "Hold heavy weights at sides, walk with good posture.",
      tips: ["Shoulders back", "Core braced", "Short quick steps"]
    }
  ],
  "Morning Run": [
    {
      id: "mr1",
      name: "5-Minute Easy Jog",
      sets: 1,
      reps: "5 min",
      restTime: "0 sec",
      muscleGroup: "Cardio",
      instructions: "Start with light jogging to warm up.",
      tips: ["Conversational pace", "Focus on breathing", "Loosen up"]
    }
  ],
  "Core Crusher": [
    {
      id: "cc1",
      name: "Plank",
      sets: 3,
      reps: "45-60 sec",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Hold forearm plank with straight body line.",
      tips: ["Don't sag hips", "Squeeze glutes", "Breathe normally"]
    },
    {
      id: "cc2",
      name: "Bicycle Crunches",
      sets: 3,
      reps: "20 each side",
      restTime: "30 sec",
      muscleGroup: "Obliques",
      instructions: "Elbow to opposite knee, alternating.",
      tips: ["Slow and controlled", "Full twist", "Lower back pressed down"]
    },
    {
      id: "cc3",
      name: "Leg Raises",
      sets: 3,
      reps: "12-15",
      restTime: "30 sec",
      muscleGroup: "Lower Abs",
      instructions: "Lying down, raise straight legs to ceiling, lower slowly.",
      tips: ["Press lower back down", "Control descent", "Don't swing"]
    },
    {
      id: "cc4",
      name: "Dead Bug",
      sets: 3,
      reps: "12 each side",
      restTime: "30 sec",
      muscleGroup: "Core Stability",
      instructions: "On back, extend opposite arm and leg while keeping back flat.",
      tips: ["Lower back stays down", "Move slowly", "Breathe out on extension"]
    },
    {
      id: "cc5",
      name: "Mountain Climbers",
      sets: 3,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Core/Cardio",
      instructions: "Plank position, drive knees to chest rapidly.",
      tips: ["Keep hips low", "Quick pace", "Core engaged"]
    },
    {
      id: "cc6",
      name: "Russian Twists",
      sets: 3,
      reps: "20 total",
      restTime: "30 sec",
      muscleGroup: "Obliques",
      instructions: "Seated, lean back, rotate with weight.",
      tips: ["Lift feet for challenge", "Full rotation", "Control tempo"]
    },
    {
      id: "cc7",
      name: "Flutter Kicks",
      sets: 3,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Lower Abs",
      instructions: "Lying down, small alternating leg kicks.",
      tips: ["Lower back pressed down", "Small movements", "Keep legs straight"]
    },
    {
      id: "cc8",
      name: "Side Plank",
      sets: 3,
      reps: "30 sec each side",
      restTime: "30 sec",
      muscleGroup: "Obliques",
      instructions: "Stack feet, hips up, hold straight line.",
      tips: ["Top hip forward", "Engage obliques", "Stack shoulders"]
    },
    {
      id: "cc9",
      name: "V-Ups",
      sets: 3,
      reps: "10-12",
      restTime: "30 sec",
      muscleGroup: "Full Core",
      instructions: "Simultaneously raise arms and legs to touch.",
      tips: ["Control the motion", "Reach for toes", "Core tight throughout"]
    },
    {
      id: "cc10",
      name: "Bird Dog",
      sets: 3,
      reps: "12 each side",
      restTime: "30 sec",
      muscleGroup: "Core Stability",
      instructions: "Hands and knees, extend opposite arm and leg.",
      tips: ["Keep back flat", "Move slowly", "Hold briefly at top"]
    }
  ],
  "Full Body Workout": [
    {
      id: "fbw1",
      name: "Squats",
      sets: 3,
      reps: "15",
      restTime: "45 sec",
      muscleGroup: "Legs",
      instructions: "Lower until thighs parallel, stand back up.",
      tips: ["Chest up", "Knees track toes", "Drive through heels"]
    },
    {
      id: "fbw2",
      name: "Push-ups",
      sets: 3,
      reps: "12-15",
      restTime: "45 sec",
      muscleGroup: "Chest",
      instructions: "Lower chest to floor, push back up.",
      tips: ["Body stays straight", "Full range", "Elbows at 45°"]
    },
    {
      id: "fbw3",
      name: "Dumbbell Rows",
      sets: 3,
      reps: "12 each arm",
      restTime: "45 sec",
      muscleGroup: "Back",
      instructions: "Row dumbbell to hip, squeeze at top.",
      tips: ["Back flat", "Elbow back", "Control negative"]
    },
    {
      id: "fbw4",
      name: "Lunges",
      sets: 3,
      reps: "10 each leg",
      restTime: "45 sec",
      muscleGroup: "Legs",
      instructions: "Step forward into lunge, return.",
      tips: ["90° angles", "Chest up", "Push through front heel"]
    },
    {
      id: "fbw5",
      name: "Shoulder Press",
      sets: 3,
      reps: "12",
      restTime: "45 sec",
      muscleGroup: "Shoulders",
      instructions: "Press dumbbells overhead.",
      tips: ["Core engaged", "Full lockout", "Don't arch back"]
    },
    {
      id: "fbw6",
      name: "Plank",
      sets: 3,
      reps: "45 sec",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Hold forearm plank.",
      tips: ["Body straight", "Breathe", "Don't sag"]
    },
    {
      id: "fbw7",
      name: "Deadlifts",
      sets: 3,
      reps: "12",
      restTime: "45 sec",
      muscleGroup: "Posterior Chain",
      instructions: "Hinge at hips, lower weight, stand up.",
      tips: ["Back flat", "Bar close", "Hip drive"]
    },
    {
      id: "fbw8",
      name: "Bicep Curls",
      sets: 3,
      reps: "12",
      restTime: "30 sec",
      muscleGroup: "Biceps",
      instructions: "Curl weights, squeeze at top.",
      tips: ["No swinging", "Full range", "Slow negative"]
    },
    {
      id: "fbw9",
      name: "Tricep Dips",
      sets: 3,
      reps: "12",
      restTime: "30 sec",
      muscleGroup: "Triceps",
      instructions: "Lower body on bench/chair, push back up.",
      tips: ["Elbows back", "90° bend", "Full lockout"]
    },
    {
      id: "fbw10",
      name: "Crunches",
      sets: 3,
      reps: "20",
      restTime: "30 sec",
      muscleGroup: "Abs",
      instructions: "Curl upper body, squeeze abs.",
      tips: ["Don't pull neck", "Exhale at top", "Control motion"]
    }
  ],
  "Cardio Mix": [
    {
      id: "cm1",
      name: "Jumping Jacks",
      sets: 3,
      reps: "1 min",
      restTime: "30 sec",
      muscleGroup: "Full Body",
      instructions: "Jump feet out, arms up, return.",
      tips: ["Land softly", "Keep rhythm", "Warm-up move"]
    },
    {
      id: "cm2",
      name: "High Knees",
      sets: 3,
      reps: "45 sec",
      restTime: "15 sec",
      muscleGroup: "Cardio",
      instructions: "Run in place, knees high.",
      tips: ["Pump arms", "Stay on toes", "Quick pace"]
    },
    {
      id: "cm3",
      name: "Butt Kicks",
      sets: 3,
      reps: "45 sec",
      restTime: "15 sec",
      muscleGroup: "Legs",
      instructions: "Run in place, kick heels to glutes.",
      tips: ["Quick tempo", "Pump arms", "Light on feet"]
    },
    {
      id: "cm4",
      name: "Skaters",
      sets: 3,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Legs",
      instructions: "Jump side to side like skating.",
      tips: ["Land softly", "Touch floor", "Stay low"]
    },
    {
      id: "cm5",
      name: "Squat Jumps",
      sets: 3,
      reps: "12",
      restTime: "30 sec",
      muscleGroup: "Legs",
      instructions: "Squat, jump up, land soft.",
      tips: ["Full squat", "Explosive jump", "Soft landing"]
    },
    {
      id: "cm6",
      name: "Jogging",
      sets: 1,
      reps: "5 min",
      restTime: "0 sec",
      muscleGroup: "Cardio",
      instructions: "Light jog in place or around.",
      tips: ["Easy pace", "Breathe", "Stay loose"]
    }
  ],
  "Yoga Flow": [
    {
      id: "yf1",
      name: "Sun Salutation",
      sets: 3,
      reps: "5 cycles",
      restTime: "30 sec",
      muscleGroup: "Full Body",
      instructions: "Flow through: mountain, forward fold, plank, cobra, down dog.",
      tips: ["Move with breath", "Flow smoothly", "Don't rush"]
    },
    {
      id: "yf2",
      name: "Warrior I",
      sets: 1,
      reps: "30 sec each side",
      restTime: "0 sec",
      muscleGroup: "Legs/Balance",
      instructions: "Lunge with back foot angled, arms overhead.",
      tips: ["Hips forward", "Back heel down", "Reach up"]
    },
    {
      id: "yf3",
      name: "Warrior II",
      sets: 1,
      reps: "30 sec each side",
      restTime: "0 sec",
      muscleGroup: "Legs/Balance",
      instructions: "Wide lunge, arms extended, gaze over front hand.",
      tips: ["Hips open", "Knee over ankle", "Strong legs"]
    },
    {
      id: "yf4",
      name: "Triangle Pose",
      sets: 1,
      reps: "30 sec each side",
      restTime: "0 sec",
      muscleGroup: "Legs/Core",
      instructions: "Wide stance, reach down to shin, other arm up.",
      tips: ["Both legs straight", "Open chest", "Reach both ways"]
    },
    {
      id: "yf5",
      name: "Downward Dog",
      sets: 3,
      reps: "45 sec",
      restTime: "15 sec",
      muscleGroup: "Full Body",
      instructions: "Inverted V shape, push hips up and back.",
      tips: ["Heels toward floor", "Spread fingers", "Relax neck"]
    },
    {
      id: "yf6",
      name: "Child's Pose",
      sets: 2,
      reps: "1 min",
      restTime: "0 sec",
      muscleGroup: "Back/Hips",
      instructions: "Knees wide, sit back, arms extended.",
      tips: ["Relax completely", "Breathe deeply", "Rest pose"]
    },
    {
      id: "yf7",
      name: "Cat-Cow",
      sets: 3,
      reps: "10 cycles",
      restTime: "0 sec",
      muscleGroup: "Spine",
      instructions: "Alternate arching and rounding spine.",
      tips: ["Move with breath", "Full range", "Wake up spine"]
    },
    {
      id: "yf8",
      name: "Pigeon Pose",
      sets: 1,
      reps: "1 min each side",
      restTime: "0 sec",
      muscleGroup: "Hips",
      instructions: "One leg bent in front, other extended back.",
      tips: ["Square hips", "Fold forward", "Deep hip stretch"]
    },
    {
      id: "yf9",
      name: "Cobra Pose",
      sets: 3,
      reps: "30 sec",
      restTime: "15 sec",
      muscleGroup: "Back",
      instructions: "Lying face down, lift chest with back muscles.",
      tips: ["Elbows close", "Shoulders down", "Gentle backbend"]
    },
    {
      id: "yf10",
      name: "Bridge Pose",
      sets: 3,
      reps: "30 sec",
      restTime: "15 sec",
      muscleGroup: "Glutes/Back",
      instructions: "Lying on back, lift hips, squeeze glutes.",
      tips: ["Feet hip-width", "Knees over ankles", "Open chest"]
    },
    {
      id: "yf11",
      name: "Seated Forward Fold",
      sets: 2,
      reps: "45 sec",
      restTime: "0 sec",
      muscleGroup: "Hamstrings",
      instructions: "Sit with legs extended, fold forward.",
      tips: ["Hinge at hips", "Keep back flat", "Reach for feet"]
    },
    {
      id: "yf12",
      name: "Supine Twist",
      sets: 1,
      reps: "1 min each side",
      restTime: "0 sec",
      muscleGroup: "Spine",
      instructions: "Lying down, drop knees to one side.",
      tips: ["Shoulders down", "Look opposite", "Relax into it"]
    },
    {
      id: "yf13",
      name: "Happy Baby",
      sets: 1,
      reps: "1 min",
      restTime: "0 sec",
      muscleGroup: "Hips",
      instructions: "On back, grab feet, pull knees toward armpits.",
      tips: ["Relax", "Rock side to side", "Gentle hip opener"]
    },
    {
      id: "yf14",
      name: "Savasana",
      sets: 1,
      reps: "3 min",
      restTime: "0 sec",
      muscleGroup: "Recovery",
      instructions: "Lie flat, relax completely, breathe naturally.",
      tips: ["Close eyes", "Scan for tension", "Full relaxation"]
    },
    {
      id: "yf15",
      name: "Standing Forward Fold",
      sets: 2,
      reps: "30 sec",
      restTime: "0 sec",
      muscleGroup: "Hamstrings",
      instructions: "Standing, hinge at hips, let head hang.",
      tips: ["Bend knees if needed", "Shake head yes/no", "Relax upper body"]
    }
  ],
  "Core Stability": [
    {
      id: "cs1",
      name: "Dead Bug",
      sets: 3,
      reps: "12 each side",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "On back, extend opposite arm and leg.",
      tips: ["Lower back down", "Move slowly", "Control breathing"]
    },
    {
      id: "cs2",
      name: "Bird Dog",
      sets: 3,
      reps: "12 each side",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Hands and knees, extend opposite limbs.",
      tips: ["Keep back flat", "Hold briefly", "Engage core"]
    },
    {
      id: "cs3",
      name: "Pallof Press",
      sets: 3,
      reps: "12 each side",
      restTime: "30 sec",
      muscleGroup: "Anti-Rotation",
      instructions: "Press cable/band out from chest, resist rotation.",
      tips: ["Stay square", "Brace core", "Control movement"]
    },
    {
      id: "cs4",
      name: "Plank",
      sets: 3,
      reps: "45 sec",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Hold forearm plank with neutral spine.",
      tips: ["Don't sag", "Breathe", "Squeeze glutes"]
    },
    {
      id: "cs5",
      name: "Side Plank",
      sets: 2,
      reps: "30 sec each side",
      restTime: "30 sec",
      muscleGroup: "Obliques",
      instructions: "Stack feet, hips up, hold straight line.",
      tips: ["Top hip forward", "Engage obliques", "Stack shoulders"]
    },
    {
      id: "cs6",
      name: "Glute Bridge",
      sets: 3,
      reps: "15",
      restTime: "30 sec",
      muscleGroup: "Glutes/Core",
      instructions: "Lying on back, lift hips, squeeze glutes.",
      tips: ["Drive through heels", "Hold at top", "Core engaged"]
    },
    {
      id: "cs7",
      name: "Slow Mountain Climbers",
      sets: 3,
      reps: "10 each side",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "Slowly drive knees to chest from plank.",
      tips: ["No hip movement", "Slow tempo", "Control breathing"]
    },
    {
      id: "cs8",
      name: "Hollow Body Hold",
      sets: 3,
      reps: "30 sec",
      restTime: "30 sec",
      muscleGroup: "Core",
      instructions: "On back, arms/legs extended, lower back pressed.",
      tips: ["No arch in back", "Squeeze abs", "Breathe normally"]
    }
  ],
  "Long Run": [
    {
      id: "lr1",
      name: "60-Minute Distance Run",
      sets: 1,
      reps: "60 min",
      restTime: "0 sec",
      muscleGroup: "Cardio",
      instructions: "Maintain steady conversational pace for the duration.",
      tips: ["Stay hydrated", "Pace yourself", "Enjoy the journey"]
    }
  ],
  "Interval Training": [
    {
      id: "it1",
      name: "Sprint Intervals",
      sets: 8,
      reps: "30 sec sprint",
      restTime: "90 sec walk",
      muscleGroup: "Cardio",
      instructions: "All-out sprint followed by walking recovery.",
      tips: ["True max effort", "Full recovery", "Stay explosive"]
    },
    {
      id: "it2",
      name: "Hill Sprints",
      sets: 6,
      reps: "20 sec",
      restTime: "2 min",
      muscleGroup: "Legs/Cardio",
      instructions: "Sprint up incline, walk back down.",
      tips: ["Drive knees", "Pump arms", "Stay low"]
    },
    {
      id: "it3",
      name: "Fartlek Runs",
      sets: 1,
      reps: "20 min",
      restTime: "0 sec",
      muscleGroup: "Cardio",
      instructions: "Alternate fast and slow running based on feel.",
      tips: ["Listen to body", "Vary terrain", "Have fun"]
    },
    {
      id: "it4",
      name: "Tempo Run",
      sets: 1,
      reps: "15 min",
      restTime: "0 sec",
      muscleGroup: "Cardio",
      instructions: "Sustained comfortably hard pace.",
      tips: ["70-80% effort", "Consistent pace", "Breathe rhythmically"]
    },
    {
      id: "it5",
      name: "Ladder Intervals",
      sets: 1,
      reps: "1-2-3-2-1 min",
      restTime: "Equal rest",
      muscleGroup: "Cardio",
      instructions: "Increase then decrease interval duration.",
      tips: ["Adjust pace", "Shorter = faster", "Push through"]
    },
    {
      id: "it6",
      name: "Burpee Intervals",
      sets: 5,
      reps: "10 burpees",
      restTime: "1 min",
      muscleGroup: "Full Body",
      instructions: "Complete burpees as fast as possible.",
      tips: ["Full burpee", "Quick transitions", "Breathe"]
    },
    {
      id: "it7",
      name: "Jump Rope Intervals",
      sets: 6,
      reps: "1 min",
      restTime: "30 sec",
      muscleGroup: "Cardio",
      instructions: "Jump rope at high intensity.",
      tips: ["Small jumps", "Wrists do work", "Stay on toes"]
    },
    {
      id: "it8",
      name: "Rowing Sprints",
      sets: 5,
      reps: "250m",
      restTime: "90 sec",
      muscleGroup: "Full Body",
      instructions: "Row hard for distance.",
      tips: ["Legs drive", "Lean back", "Arms finish"]
    },
    {
      id: "it9",
      name: "Bike Sprints",
      sets: 6,
      reps: "30 sec",
      restTime: "90 sec",
      muscleGroup: "Legs",
      instructions: "All-out cycling effort.",
      tips: ["High resistance", "Stay seated", "Push/pull pedals"]
    },
    {
      id: "it10",
      name: "Cool Down Jog",
      sets: 1,
      reps: "5 min",
      restTime: "0 sec",
      muscleGroup: "Recovery",
      instructions: "Easy jog to bring heart rate down.",
      tips: ["Very easy pace", "Breathe deeply", "Shake out legs"]
    }
  ],
  "Cycling Session": [
    {
      id: "cy1",
      name: "45-Minute Bike Ride",
      sets: 1,
      reps: "45 min",
      restTime: "0 sec",
      muscleGroup: "Legs/Cardio",
      instructions: "Steady cycling at moderate intensity.",
      tips: ["Vary intensity", "Stay hydrated", "Enjoy the ride"]
    }
  ],
  "Swimming": [
    {
      id: "sw1",
      name: "50-Minute Swim Session",
      sets: 1,
      reps: "50 min",
      restTime: "0 sec",
      muscleGroup: "Full Body",
      instructions: "Mix of freestyle, backstroke, and breaststroke.",
      tips: ["Warm up first", "Focus on form", "Vary strokes"]
    }
  ]
};

const toGoalTag = (goal: string): ExerciseGoalTag => {
  const normalizedGoal = goal.trim().toLowerCase();
  if (normalizedGoal === "build" || normalizedGoal === "build muscle") return "muscle";
  if (normalizedGoal === "lose" || normalizedGoal === "lose weight") return "fat_loss";
  if (normalizedGoal === "gain" || normalizedGoal === "gain weight" || normalizedGoal === "weight_gain") return "weight_gain";
  if (normalizedGoal === "endurance" || normalizedGoal === "improve endurance") return "endurance";
  return "muscle";
};

const resolveIntensityLevel = (weeklyHoursRaw: string, hasHecticSchedule: boolean): IntensityLevel => {
  if (hasHecticSchedule) return "low";

  const value = (weeklyHoursRaw || "").toString().trim().toLowerCase();
  if (!value) return "low";

  if (value.includes("+")) return "high";

  const rangeMatch = value.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const lower = Number(rangeMatch[1]);
    const upper = Number(rangeMatch[2]);
    if (upper <= 3) return "low";
    if (lower >= 5) return "high";
    return "moderate";
  }

  const numericHours = Number(value);
  if (Number.isFinite(numericHours)) {
    if (numericHours <= 3) return "low";
    if (numericHours <= 5) return "moderate";
    return "high";
  }

  return "low";
};

const getTargetExerciseCount = (intensity: IntensityLevel): number => {
  if (intensity === "low") return 5;
  if (intensity === "moderate") return 7;
  return 10;
};

const getExerciseGoalTag = (exercise: Exercise): ExerciseGoalTag => {
  const text = `${exercise.name} ${exercise.muscleGroup}`.toLowerCase();

  if (/run|jog|sprint|cycling|bike|swim|rowing|jump rope|high knees|jumping jacks|mountain climbers|burpees|battle ropes|cardio/.test(text)) {
    return "fat_loss";
  }
  if (/plank|tempo|interval|distance|endurance|core/.test(text)) {
    return "endurance";
  }
  if (/barbell|bench|deadlift|squat|press|thrust|weighted|power/.test(text)) {
    return "weight_gain";
  }
  return "muscle";
};

const WorkoutDetail = ({ workout, canStartTraining, onBack, onComplete, isCompleted }: WorkoutDetailProps) => {
  const [checkedExerciseIds, setCheckedExerciseIds] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "inProgress" | "completed">("idle");
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const persistedCompletionRef = useRef(false);
  const workoutStateHydratedRef = useRef(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogType>(null);
  const [pendingLastExerciseId, setPendingLastExerciseId] = useState<string | null>(null);
  const dailyMetrics = new DailyMetricsService();

  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem("userProfile");
      if (!raw) return { weeklyHours: "", hasHecticSchedule: false, goal: "build" };
      const parsed = JSON.parse(raw) as {
        weeklyHours?: string | number;
        hasHecticSchedule?: boolean;
        goal?: string;
      };
      return {
        weeklyHours: String(parsed.weeklyHours ?? ""),
        hasHecticSchedule: Boolean(parsed.hasHecticSchedule),
        goal: String(parsed.goal ?? "build"),
      };
    } catch {
      return { weeklyHours: "", hasHecticSchedule: false, goal: "build" };
    }
  }, []);

  const exercises = useMemo(() => {
    const fullExercises = exerciseDatabase[workout.name] || [];
    const intensityLevel = resolveIntensityLevel(profile.weeklyHours, profile.hasHecticSchedule);
    const targetCount = getTargetExerciseCount(intensityLevel);
    const prioritizedTag = toGoalTag(profile.goal);

    const matching = fullExercises.filter((exercise) => getExerciseGoalTag(exercise) === prioritizedTag);
    const remaining = fullExercises.filter((exercise) => getExerciseGoalTag(exercise) !== prioritizedTag);
    const personalized = [...matching, ...remaining];

    return personalized.slice(0, Math.min(targetCount, personalized.length));
  }, [workout.name, profile.weeklyHours, profile.hasHecticSchedule, profile.goal]);

  const visibleExerciseIds = useMemo(() => new Set(exercises.map((exercise) => exercise.id)), [exercises]);
  const totalExercises = exercises.length;
  const todayKey = localDateId().toString();
  const storageKey = `workout_${todayKey}_${workout.id}`;

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };
  const getWorkoutDocRef = (uid: string, dateId: string) => doc(db, "users", uid, "workouts", dateId);

  const persistCompletedWorkout = async (duration: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || persistedCompletionRef.current) return;
    persistedCompletionRef.current = true;

    const dateId = localDateId().toString();
    const safeDuration = Math.max(0, Number(duration) || 0);

    // Store each workout under users/{uid}/workouts/{dateId}/items/{workoutId}
    const workoutRef = doc(collection(db, "users", uid, "workouts", dateId, "items"), workout.id);
    await setDoc(
      workoutRef,
      {
        workoutId: workout.id,
        name: workout.name,
        durationSeconds: safeDuration,
        completed: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await dailyMetrics.setWorkoutCompletion(safeDuration, true, dateId, uid);
    await setDoc(
      getWorkoutDocRef(uid, dateId),
      {
        workoutId: workout.id,
        workoutStarted: false,
        workoutCompleted: true,
        startTime: startedAt ?? null,
        workoutMinutes: Math.max(0, Math.floor(safeDuration / 60)),
        completedExercises: checkedExerciseIds,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const persistResetWorkout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const dateId = localDateId().toString();
    const workoutRef = doc(collection(db, "users", uid, "workouts", dateId, "items"), workout.id);
    await setDoc(
      workoutRef,
      {
        workoutId: workout.id,
        name: workout.name,
        durationSeconds: 0,
        completed: false,
        resetAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await setDoc(
      getWorkoutDocRef(uid, dateId),
      {
        workoutId: workout.id,
        workoutStarted: false,
        workoutCompleted: false,
        startTime: null,
        workoutMinutes: 0,
        completedExercises: [],
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
    await dailyMetrics.setWorkoutCompletion(0, false, dateId, uid);
  };

  const completeWorkout = async () => {
    if (status === "completed") return;
    const finalElapsed =
      status === "inProgress" && typeof startedAt === "number"
        ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        : Math.max(0, Number(elapsedSeconds) || 0);
    setElapsedSeconds(finalElapsed);
    setStatus("completed");
    setIsWorkoutCompleted(true);
    onComplete();
    await persistCompletedWorkout(finalElapsed);
  };

  const startWorkout = () => {
    if (status !== "idle") return;
    setStartedAt(Date.now());
    setStatus("inProgress");
    setIsWorkoutStarted(true);
    setIsWorkoutCompleted(false);
  };

  const resetWorkout = () => {
    localStorage.removeItem(storageKey);
    setCheckedExerciseIds([]);
    setCompletedExercises(0);
    setElapsedSeconds(0);
    setStartedAt(null);
    setStatus("idle");
    setIsWorkoutStarted(false);
    setIsWorkoutCompleted(false);
    persistedCompletionRef.current = false;
    void persistResetWorkout();
  };

  const handleStartWorkoutPress = () => {
    setConfirmDialog("start");
  };

  const handleResetWorkoutPress = () => {
    setConfirmDialog("reset");
  };

  const handleCompleteWorkoutPress = () => {
    if (!canStartTraining) return;
    setConfirmDialog("complete");
  };

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        status?: "idle" | "inProgress" | "completed";
        elapsedSeconds?: number;
        completedExercises?: number;
        startedAt?: number | null;
        checkedExerciseIds?: string[];
      };

      const safeStatus =
        parsed.status === "inProgress" || parsed.status === "completed" ? parsed.status : "idle";
      const safeStartedAt = typeof parsed.startedAt === "number" ? parsed.startedAt : null;
      const savedElapsed = Math.max(0, Number(parsed.elapsedSeconds) || 0);
      const restoredElapsed =
        safeStatus === "inProgress" && safeStartedAt
          ? Math.max(savedElapsed, Math.floor((Date.now() - safeStartedAt) / 1000))
          : savedElapsed;
      const safeCheckedIds = Array.isArray(parsed.checkedExerciseIds)
        ? parsed.checkedExerciseIds.filter((id) => typeof id === "string" && visibleExerciseIds.has(id))
        : [];
      const safeCompletedExercises = Math.min(
        totalExercises,
        Math.max(0, Number(parsed.completedExercises) || safeCheckedIds.length)
      );

      setStatus(safeStatus);
      setIsWorkoutStarted(safeStatus === "inProgress" || safeStatus === "completed");
      setIsWorkoutCompleted(safeStatus === "completed");
      setStartedAt(safeStartedAt);
      setElapsedSeconds(restoredElapsed);
      setCheckedExerciseIds(safeCheckedIds);
      setCompletedExercises(safeCompletedExercises);
      persistedCompletionRef.current = safeStatus === "completed";
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, totalExercises, visibleExerciseIds]);

  useEffect(() => {
    let cancelled = false;
    const restoreFromFirestore = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        workoutStateHydratedRef.current = true;
        return;
      }

      try {
        const dateId = localDateId().toString();
        const snap = await getDoc(getWorkoutDocRef(uid, dateId));
        if (!snap.exists()) {
          if (cancelled) return;
          setCheckedExerciseIds([]);
          setCompletedExercises(0);
          setElapsedSeconds(0);
          setStatus("idle");
          setIsWorkoutStarted(false);
          setIsWorkoutCompleted(false);
          console.debug("AppState", "No workout doc for today. Using defaults.");
          return;
        }

        const data = snap.data() as Record<string, any>;
        const docWorkoutId = typeof data?.workoutId === "string" ? data.workoutId : "";
        if (docWorkoutId && docWorkoutId !== workout.id) {
          return;
        }

        const restoredChecked = Array.isArray(data?.completedExercises)
          ? (data.completedExercises as unknown[]).filter((id) => typeof id === "string" && visibleExerciseIds.has(id as string)) as string[]
          : [];
        const restoredMinutes = Math.max(0, Number(data?.workoutMinutes ?? 0) || 0);
        const restoredStartTime = typeof data?.startTime === "number" ? Math.max(0, Math.floor(data.startTime)) : null;
        const restoredWorkoutStarted = Boolean(data?.workoutStarted ?? false);
        const computedElapsedFromStart = restoredWorkoutStarted && typeof restoredStartTime === "number"
          ? Math.max(0, Math.floor((Date.now() - restoredStartTime) / 1000))
          : 0;
        const restoredSeconds = Math.max(Math.floor(restoredMinutes * 60), computedElapsedFromStart);
        const restoredCompleted = Boolean(data?.workoutCompleted ?? false);

        if (cancelled) return;
        setCheckedExerciseIds(restoredChecked);
        setCompletedExercises(Math.min(totalExercises, restoredChecked.length));
        setElapsedSeconds(restoredSeconds);
        setStartedAt(restoredWorkoutStarted ? restoredStartTime : null);
        setIsWorkoutCompleted(restoredCompleted);
        setIsWorkoutStarted(restoredWorkoutStarted || restoredCompleted || restoredChecked.length > 0 || restoredSeconds > 0);
        setStatus(restoredCompleted ? "completed" : (restoredWorkoutStarted || restoredChecked.length > 0 || restoredSeconds > 0 ? "inProgress" : "idle"));
        persistedCompletionRef.current = restoredCompleted;
        console.debug("AppState", `Workout minutes restored: ${restoredMinutes}`);
        console.debug("AppState", `Exercises restored: ${restoredChecked.length}`);
        console.debug("AppState", `Workout completion restored: ${restoredCompleted}`);
      } catch (error) {
        console.error("AppState", "Failed to restore workout state", error);
      } finally {
        workoutStateHydratedRef.current = true;
      }
    };

    void restoreFromFirestore();
    return () => {
      cancelled = true;
    };
  }, [workout.id, totalExercises, visibleExerciseIds]);

  useEffect(() => {
    const payload = {
      status,
      elapsedSeconds: Math.max(0, Number(elapsedSeconds) || 0),
      completedExercises: Math.max(0, Number(completedExercises) || 0),
      startedAt,
      checkedExerciseIds,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [status, elapsedSeconds, completedExercises, startedAt, checkedExerciseIds, storageKey]);

  useEffect(() => {
    if (!workoutStateHydratedRef.current) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const dateId = localDateId().toString();
    const effectiveElapsedSeconds =
      status === "inProgress" && typeof startedAt === "number"
        ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        : Math.max(0, Number(elapsedSeconds) || 0);
    const safeWorkoutMinutes = Math.max(0, Math.floor(effectiveElapsedSeconds / 60));
    const workoutStarted = status === "inProgress";
    const workoutCompleted = status === "completed" || isWorkoutCompleted;

    setDoc(
      getWorkoutDocRef(uid, dateId),
      {
        workoutId: workout.id,
        workoutStarted,
        startTime: workoutStarted ? startedAt : null,
        workoutCompleted,
        workoutMinutes: safeWorkoutMinutes,
        completedExercises: checkedExerciseIds,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    ).catch((error) => {
      console.error("WorkoutDebug", "Failed to save workout state", error);
    });
  }, [status, startedAt, isWorkoutCompleted, elapsedSeconds, checkedExerciseIds, workout.id]);

  useEffect(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (status !== "inProgress" || typeof startedAt !== "number") return;

    const syncElapsedFromStart = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    syncElapsedFromStart();
    intervalRef.current = window.setInterval(syncElapsedFromStart, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, startedAt]);

  useEffect(() => {
    const syncElapsedOnReturn = () => {
      if (status !== "inProgress" || typeof startedAt !== "number") return;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    window.addEventListener("focus", syncElapsedOnReturn);
    document.addEventListener("visibilitychange", syncElapsedOnReturn);
    return () => {
      window.removeEventListener("focus", syncElapsedOnReturn);
      document.removeEventListener("visibilitychange", syncElapsedOnReturn);
    };
  }, [status, startedAt]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleExercise = (exerciseId: string) => {
    if (!canStartTraining) return;
    if (!isWorkoutStarted || isWorkoutCompleted) return;
    setCheckedExerciseIds((prev) => {
      const isAlreadyChecked = prev.includes(exerciseId);
      const next = isAlreadyChecked ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId];
      if (!isAlreadyChecked && status === "inProgress" && totalExercises > 0 && next.length === totalExercises) {
        setPendingLastExerciseId(exerciseId);
        setConfirmDialog("finish");
      }
      setCompletedExercises(next.length);
      return next;
    });
  };

  const canInteractWithExercises = canStartTraining && isWorkoutStarted && !isWorkoutCompleted;

  const handleConfirmAction = () => {
    const action = confirmDialog;
    setPendingLastExerciseId(null);
    setConfirmDialog(null);
    if (action === "start") {
      startWorkout();
      return;
    }
    if (action === "reset") {
      resetWorkout();
      return;
    }
    if (action === "complete" || action === "finish") {
      void completeWorkout();
      return;
    }
  };

  const handleCancelDialog = () => {
    if (confirmDialog === "finish" && pendingLastExerciseId) {
      setCheckedExerciseIds((prev) => {
        const next = prev.filter((id) => id !== pendingLastExerciseId);
        setCompletedExercises(next.length);
        return next;
      });
    }
    setPendingLastExerciseId(null);
    setConfirmDialog(null);
  };

  const getDialogContent = () => {
    switch (confirmDialog) {
      case "start":
        return {
          title: "Start Workout",
          message: "Are you sure you want to start this workout?",
          confirmLabel: "Yes",
        };
      case "reset":
        return {
          title: "Reset Workout",
          message: "Are you sure you want to reset this workout? All progress will be lost.",
          confirmLabel: "Yes",
        };
      case "complete":
        return {
          title: "Complete Workout",
          message: "Are you sure you have completed this workout?",
          confirmLabel: "Yes",
        };
      case "finish":
        return {
          title: "Finish Workout",
          message: "Have you completed all exercises in this workout?",
          confirmLabel: "Yes",
        };
      default:
        return {
          title: "",
          message: "",
          confirmLabel: "Yes",
        };
    }
  };

  const progress = exercises.length > 0 
    ? (completedExercises / exercises.length) * 100 
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-success bg-success/20";
      case "Medium": return "text-warning bg-warning/20";
      case "Hard": return "text-destructive bg-destructive/20";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  return (
    <div className="mobile-page">
      {/* Background Effects */}
      <div className="    pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 mobile-header">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Workouts</span>
        </button>

        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="mobile-title">{workout.name}</h1>
                <span className={`text-base px-2 py-1 rounded-full ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty}
                </span>
              </div>
            </div>
            <span className="text-base bg-secondary px-3 py-1 rounded-full">{workout.type}</span>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-base">
                {status === "inProgress" || status === "completed" ? formatTime(elapsedSeconds) : workout.duration}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-base">{workout.calories} cal</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="text-base">{exercises.length} exercises</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-base mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full  ">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
          {status === "idle" && canStartTraining && (
            <Button className="w-full" variant={isCompleted ? "outline" : "default"} onClick={handleStartWorkoutPress}>
              <Play className="w-5 h-5 mr-2" /> Start Workout
            </Button>
          )}
          {status === "inProgress" && (
            <Button className="w-full" variant="default" onClick={handleCompleteWorkoutPress} disabled={!canStartTraining}>
              <Check className="w-5 h-5 mr-2" /> Complete Workout
            </Button>
          )}
          {status === "completed" && (
            <div className="space-y-3">
              <div className="text-center text-sm text-success font-medium">Workout Completed</div>
              <Button className="w-full" variant="outline" onClick={handleResetWorkoutPress}>
                Reset Workout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Exercise List */}
      <div className="relative z-10">
        <h2 className="mobile-title mb-4">Exercises</h2>
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`bg-card rounded-xl border transition-all ${
                checkedExerciseIds.includes(exercise.id) 
                  ? "border-success/50 bg-success/5" 
                  : "border-border/50"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExercise(exercise.id)}
                      disabled={!canInteractWithExercises}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        checkedExerciseIds.includes(exercise.id)
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-primary/20"
                      }`}
                    >
                      {checkedExerciseIds.includes(exercise.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-base font-medium">{index + 1}</span>
                      )}
                    </button>
                    <div>
                      <p className={`font-medium ${checkedExerciseIds.includes(exercise.id) ? "line-through text-muted-foreground" : ""}`}>
                        {exercise.name}
                      </p>
                      <p className="text-base text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps} • {exercise.restTime} rest
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    {expandedExercise === exercise.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedExercise === exercise.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base px-2 py-1 rounded-full bg-primary/20 text-primary">
                        {exercise.muscleGroup}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-base font-medium flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-primary" />
                        How to do it
                      </h4>
                      <p className="text-base text-muted-foreground">{exercise.instructions}</p>
                    </div>

                    <div>
                      <h4 className="text-base font-medium mb-2">💡 Pro Tips</h4>
                      <ul className="space-y-1">
                        {exercise.tips.map((tip, i) => (
                          <li key={i} className="text-base text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {exercises.length === 0 && (
          <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display font-bold mb-2">Custom Workout</h3>
            <p className="text-muted-foreground">
              This is a {workout.duration} {workout.type.toLowerCase()} session. 
              Follow your own routine or use a fitness app to guide you.
            </p>
          </div>
        )}
      </div>

      <Dialog open={confirmDialog !== null}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-sm sm:max-w-md max-h-[85vh] overflow-y-auto p-4 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>{getDialogContent().title}</DialogTitle>
            <DialogDescription>{getDialogContent().message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialog}>No</Button>
            <Button onClick={handleConfirmAction}>{getDialogContent().confirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutDetail;
