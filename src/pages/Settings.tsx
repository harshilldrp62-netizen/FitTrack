import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, FileText, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { syncNativeReminders } from "@/services/NativeStepService";

const Settings = () => {
  const FEEDBACK_EMAIL = "harshilldrp62@gmail.com";
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const savedNotifications = localStorage.getItem("notificationsEnabled");
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true");
    }
  }, []);

  const syncLocalSchedules = async (enabled: boolean) => {
    if (!Capacitor.isNativePlatform()) return;

    type Reminder = { id: string; enabled: boolean; time: string };
    const rawReminders = localStorage.getItem("reminders");
    const reminders: Reminder[] = rawReminders ? JSON.parse(rawReminders) : [];

    const rawWorkout = localStorage.getItem("customWorkoutReminder");
    const workout = rawWorkout ? JSON.parse(rawWorkout) : null;
    await syncNativeReminders(
      enabled,
      reminders,
      workout?.enabled && typeof workout.time === "string"
        ? { enabled: true, time: workout.time }
        : { enabled: false, time: "18:00" }
    );
  };

  const toggleNotifications = async (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem("notificationsEnabled", checked.toString());

    if (checked && Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== "granted") {
        setNotifications(false);
        localStorage.setItem("notificationsEnabled", "false");
        toast({
          title: "Notifications disabled",
          description: "Permission was not granted.",
        });
        return;
      }
    }

    await syncLocalSchedules(checked);
    toast({
      title: checked ? "Notifications enabled" : "Notifications disabled",
      description: checked ? "Reminders are active." : "All reminders were turned off.",
    });
  };

  const handleSubmitFeedback = async () => {
    const feedbackMessage = feedback.trim();
    if (!feedbackMessage) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const subject = encodeURIComponent("FitTrack App Feedback");
      const body = encodeURIComponent(feedbackMessage);
      const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      window.location.href = mailto;

      setFeedback("");
    } catch (error) {
      console.error("Feedback submission failed:", error);
      toast({
        title: "Failed to send feedback",
        description: "No email application found.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">Customize your app</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Notification Preferences */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-base text-muted-foreground">
                  Enable app notifications
                </p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Feedback & Bug Reports</h2>
          </div>
          <Textarea
            placeholder="Share your feedback, report bugs, or suggest features..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] mb-4"
          />
          <Button onClick={handleSubmitFeedback} className="w-full">
            Send Feedback
          </Button>
        </div>

        {/* About Section */}
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <div className="space-y-2 text-base text-muted-foreground">
            <p>
              FitTrack is a personal fitness and nutrition tracking application designed to help users maintain a
              healthy lifestyle. The app allows users to monitor their workouts, track calorie intake, record daily
              water consumption, and measure overall progress. FitTrack encourages consistency through streak tracking
              and provides a simple way to stay accountable to daily fitness goals.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Settings;
